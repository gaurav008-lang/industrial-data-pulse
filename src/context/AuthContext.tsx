
import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  User,
  applyActionCode
} from 'firebase/auth';
import { app } from '@/lib/firebase';
import { toast } from 'sonner';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  googleSignIn: () => Promise<User>;
  sendVerificationEmail: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyOtp: (otp: string, actionCode: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, [auth]);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      toast.success('Signed in successfully');
      return userCredential.user;
    } catch (error: any) {
      const errorCode = error.code;
      let errorMessage = 'Failed to sign in';
      
      if (errorCode === 'auth/user-not-found') {
        errorMessage = 'No account with that email was found';
      } else if (errorCode === 'auth/wrong-password') {
        errorMessage = 'Invalid password';
      } else if (errorCode === 'auth/invalid-credential') {
        errorMessage = 'Invalid credentials';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      toast.success('Account created successfully');
      
      // Send verification email
      await sendEmailVerification(userCredential.user);
      toast.info('Verification email sent. Please check your email.');
      
      return userCredential.user;
    } catch (error: any) {
      const errorCode = error.code;
      let errorMessage = 'Failed to create account';
      
      if (errorCode === 'auth/email-already-in-use') {
        errorMessage = 'Email is already in use';
      } else if (errorCode === 'auth/invalid-email') {
        errorMessage = 'Invalid email format';
      } else if (errorCode === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
      toast.info('Signed out');
    } catch (error) {
      toast.error('Failed to sign out');
      throw error;
    }
  };

  // Sign in with Google
  const googleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      toast.success('Signed in with Google successfully');
      return result.user;
    } catch (error: any) {
      toast.error('Failed to sign in with Google');
      throw error;
    }
  };

  // Send verification email
  const sendVerificationEmail = async () => {
    if (!currentUser) {
      toast.error('No user signed in');
      throw new Error('No user signed in');
    }

    try {
      await sendEmailVerification(currentUser);
      toast.success('Verification email sent. Please check your inbox.');
    } catch (error) {
      toast.error('Failed to send verification email');
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent. Please check your inbox.');
    } catch (error) {
      toast.error('Failed to send password reset email');
      throw error;
    }
  };

  // Verify OTP for email verification
  const verifyOtp = async (otp: string, actionCode: string) => {
    try {
      await applyActionCode(auth, actionCode);
      toast.success('Email verified successfully');
    } catch (error) {
      toast.error('Failed to verify email');
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    signIn,
    signUp,
    logout,
    googleSignIn,
    sendVerificationEmail,
    resetPassword,
    verifyOtp
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
