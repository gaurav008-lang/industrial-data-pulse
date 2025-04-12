
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail } from 'lucide-react';
import { 
  InputOTP, 
  InputOTPGroup, 
  InputOTPSlot 
} from '@/components/ui/input-otp';

const VerifyEmail = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [actionCode, setActionCode] = useState(''); // This would come from URL in a real implementation
  const navigate = useNavigate();
  const { currentUser, sendVerificationEmail, verifyOtp } = useAuth();

  useEffect(() => {
    // Check if user exists and if their email is already verified
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (currentUser.emailVerified) {
      navigate('/');
    }
    
    // Get action code from URL query params in a real implementation
    // const urlParams = new URLSearchParams(window.location.search);
    // const code = urlParams.get('oobCode');
    // if (code) setActionCode(code);
    
  }, [currentUser, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await verifyOtp(otp, actionCode);
      navigate('/');
    } catch (err) {
      setError('Invalid or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResendLoading(true);
    setError('');
    
    try {
      await sendVerificationEmail();
      setCountdown(60); // 60 seconds cooldown
    } catch (err) {
      setError('Failed to resend verification email');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Verify your email</CardTitle>
          <CardDescription className="text-center">
            We've sent a verification code to{" "}
            <span className="font-medium">{currentUser?.email}</span>
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleVerify}
              disabled={otp.length !== 6 || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Verifying
                </>
              ) : (
                'Verify Email'
              )}
            </Button>
          </div>
        </CardContent>
        
        <CardFooter className="flex-col space-y-2">
          <p className="text-center text-sm text-gray-600 w-full">
            Didn't receive the code?{" "}
            {countdown > 0 ? (
              <span className="text-muted-foreground">
                Resend in {countdown}s
              </span>
            ) : (
              <Button 
                variant="link" 
                className="p-0 h-auto text-blue-600" 
                onClick={handleResendEmail}
                disabled={resendLoading}
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" /> 
                    Sending
                  </>
                ) : (
                  'Resend code'
                )}
              </Button>
            )}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default VerifyEmail;
