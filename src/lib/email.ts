
import { database } from './firebase';
import { ref, push, set, serverTimestamp } from 'firebase/database';

// Send email to admin directly
export const sendAdminEmail = async (
  to: string,
  subject: string,
  message: string,
  html: boolean = false
) => {
  try {
    // Since we can't directly send emails from the frontend,
    // we'll create a record in Firebase that a cloud function can process
    const emailRef = push(ref(database, 'admin/emails/outbox'));
    await set(emailRef, {
      to,
      from: 'noreply@plcwebapp.com',
      subject,
      message,
      html,
      timestamp: serverTimestamp(),
      status: 'pending'
    });
    
    console.log(`Email request created: ${subject}`);
    return true;
  } catch (error) {
    console.error('Error creating email request:', error);
    return false;
  }
};

// Function to verify a user (to be called by admin)
export const verifyUserByAdmin = async (userId: string) => {
  try {
    // Update user verification status
    const userRef = ref(database, `users/${userId}`);
    await set(userRef, {
      verified: true,
      verificationPending: false,
      verifiedAt: serverTimestamp()
    });
    
    // Remove from pending verification
    const pendingRef = ref(database, `admin/pendingVerifications/${userId}`);
    await set(pendingRef, null);
    
    return true;
  } catch (error) {
    console.error('Error verifying user:', error);
    return false;
  }
};
