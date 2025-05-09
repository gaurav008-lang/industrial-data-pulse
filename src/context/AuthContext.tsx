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
import { app, database } from '@/lib/firebase';
import { toast } from 'sonner';
import { ref, set, serverTimestamp, push } from 'firebase/database';
import { sendAdminEmail } from '@/lib/email';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  googleSignIn: () => Promise<User>;
  sendVerificationEmail: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Admin email for verification approval
const ADMIN_EMAIL = 'gauravthamke100@gmail.com';

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
      
      // Add user to pending verification in database
      const userId = userCredential.user.uid;
      const timestamp = new Date().toISOString();
      
      await set(ref(database, `users/${userId}`), {
        email: email,
        createdAt: timestamp,
        verified: false,
        verificationPending: true
      });
      
      // Send notification to admin for verification
      await set(ref(database, `admin/pendingVerifications/${userId}`), {
        email: email,
        timestamp: timestamp,
        userId: userId
      });
      
      // Send email to admin for manual verification
      await sendAdminVerificationEmail(email, userId);
      
      toast.info('Verification request sent to admin. Please wait for approval.');
      
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

  // Send email to admin for verification - improved implementation
  const sendAdminVerificationEmail = async (userEmail: string, userId: string) => {
    try {
      // Store the request in the database with a unique key
      const verificationRef = push(ref(database, `admin/emails/verification`));
      await set(verificationRef, {
        to: ADMIN_EMAIL,
        from: 'noreply@plcwebapp.com',
        subject: 'New User Verification Request',
        message: `
          <h2>New User Registration</h2>
          <p>A new user has registered and requires verification:</p>
          <ul>
            <li><strong>Email:</strong> ${userEmail}</li>
            <li><strong>User ID:</strong> ${userId}</li>
            <li><strong>Registration Time:</strong> ${new Date().toLocaleString()}</li>
          </ul>
          <p>Please verify this user by updating their verification status in the admin panel.</p>
          <p>Or click the link below to directly approve this user:</p>
          <p><a href="https://plcwebapp.com/admin/verify/${userId}">Verify User</a></p>
        `,
        html: true,
        timestamp: serverTimestamp(),
        status: 'pending'
      });
      
      // Also send directly if possible using sendAdminEmail helper
      await sendAdminEmail(ADMIN_EMAIL, 'New User Verification Request', `New user registered: ${userEmail}. Please verify this user.`);
      
      console.log(`Verification email request sent to admin for user: ${userEmail}`);
    } catch (error) {
      console.error('Error sending admin verification email:', error);
      // We still return successfully even if email fails, as the DB record was created
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
      
      // Check if this is a new user (first time sign in)
      const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
      
      if (isNewUser) {
        // Add user to pending verification in database
        const userId = result.user.uid;
        const email = result.user.email || 'unknown';
        const timestamp = new Date().toISOString();
        
        await set(ref(database, `users/${userId}`), {
          email: email,
          createdAt: timestamp,
          verified: false,
          verificationPending: true
        });
        
        // Send notification to admin for verification
        await set(ref(database, `admin/pendingVerifications/${userId}`), {
          email: email,
          timestamp: timestamp,
          userId: userId
        });
        
        // Send email to admin for manual verification
        await sendAdminVerificationEmail(email, userId);
        
        toast.info('Verification request sent to admin. Please wait for approval.');
      }
      
      toast.success('Signed in with Google successfully');
      return result.user;
    } catch (error: any) {
      toast.error('Failed to sign in with Google');
      throw error;
    }
  };

  // Send verification email (placeholder for future use)
  const sendVerificationEmail = async () => {
    if (!currentUser) {
      toast.error('No user signed in');
      throw new Error('No user signed in');
    }

    try {
      toast.success('Verification request already sent to admin. Please wait for approval.');
    } catch (error) {
      toast.error('Failed to send verification request');
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

  const value = {
    currentUser,
    loading,
    signIn,
    signUp,
    logout,
    googleSignIn,
    sendVerificationEmail,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
