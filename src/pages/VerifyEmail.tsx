import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, RefreshCw, LogOut } from 'lucide-react';
import { ref, get, onValue, set } from 'firebase/database';
import { database } from '@/lib/firebase';
import { sendAdminEmail } from '@/lib/email';
import { toast } from 'sonner';

const VerifyEmail = () => {
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [lastRequestTime, setLastRequestTime] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setCheckingStatus(false);
      return;
    }

    const userRef = ref(database, `users/${currentUser.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setIsVerified(userData.verified === true);
        
        if (userData.lastVerificationRequest) {
          setLastRequestTime(userData.lastVerificationRequest);
        }
      } else {
        setIsVerified(false);
      }
      setCheckingStatus(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (checkingStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isVerified) {
    return <Navigate to="/" />;
  }
  
  const handleResendVerification = async () => {
    setLoading(true);
    try {
      if (!currentUser || !currentUser.email) throw new Error("No user logged in");
      
      const timestamp = new Date().toISOString();
      const userRef = ref(database, `users/${currentUser.uid}`);
      await get(userRef).then(async (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          userData.lastVerificationRequest = timestamp;
          await set(userRef, userData);
        }
      });
      
      await sendAdminEmail(
        'gauravthamke100@gmail.com',
        'Verification Reminder: User Account Pending',
        `User ${currentUser.email} (ID: ${currentUser.uid}) is still waiting for verification. Please verify this account at your earliest convenience.`
      );
      
      setLastRequestTime(timestamp);
      toast.success('Verification reminder sent to admin');
    } catch (error) {
      console.error("Error sending verification reminder:", error);
      toast.error('Failed to send verification reminder');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
    } catch (error) {
      console.error("Failed to log out", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Verification Pending</CardTitle>
          <CardDescription className="text-center">
            Your account is waiting for admin verification.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-col items-center justify-center p-6 bg-gray-100 rounded-lg">
            <Mail className="h-12 w-12 text-primary mb-4" />
            <p className="text-center mb-4">
              A verification request has been sent to admin at <strong>gauravthamke100@gmail.com</strong>.
              You'll be able to access the app once your account has been approved.
            </p>
            {lastRequestTime && (
              <p className="text-center text-sm text-muted-foreground">
                Last verification request: {new Date(lastRequestTime).toLocaleString()}
              </p>
            )}
            <p className="text-center text-sm text-muted-foreground mt-2">
              This might take some time. Please be patient.
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-3">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => window.location.reload()} 
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Check verification status
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResendVerification}
            disabled={loading}
          >
            <Mail className="mr-2 h-4 w-4" /> Send verification reminder
          </Button>
          <Button 
            variant="ghost" 
            className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
            disabled={loading}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default VerifyEmail;
