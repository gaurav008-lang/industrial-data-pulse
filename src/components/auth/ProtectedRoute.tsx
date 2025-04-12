
import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
  requireVerification?: boolean;
}

const ProtectedRoute = ({ children, requireVerification = true }: ProtectedRouteProps) => {
  const { currentUser, loading } = useAuth();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [checkingVerification, setCheckingVerification] = useState(true);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!currentUser) {
        setCheckingVerification(false);
        return;
      }

      try {
        const userRef = ref(database, `users/${currentUser.uid}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setIsVerified(userData.verified === true);
          
          if (userData.verificationPending && !userData.verified) {
            toast.info('Your account is pending verification by admin.', {
              id: 'verification-pending',
              duration: 5000,
            });
          }
        } else {
          // If no record found, set as unverified
          setIsVerified(false);
        }
      } catch (error) {
        console.error("Error checking verification status:", error);
        setIsVerified(false);
      } finally {
        setCheckingVerification(false);
      }
    };

    if (currentUser && requireVerification) {
      checkVerificationStatus();
    } else {
      setCheckingVerification(false);
    }
  }, [currentUser, requireVerification]);

  // If authentication is still loading or checking verification, show a loading spinner
  if (loading || (requireVerification && checkingVerification)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not logged in, redirect to login page
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If requireVerification is true and user is not verified, redirect to verification page
  if (requireVerification && isVerified === false) {
    return <Navigate to="/verify-email" />;
  }

  // If user is logged in and verified (if required), render the children
  return <>{children}</>;
};

export default ProtectedRoute;
