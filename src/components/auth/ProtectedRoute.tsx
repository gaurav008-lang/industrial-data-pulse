
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireVerification?: boolean;
}

const ProtectedRoute = ({ children, requireVerification = true }: ProtectedRouteProps) => {
  const { currentUser, loading } = useAuth();

  // If authentication is still loading, you can show a loading spinner
  if (loading) {
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

  // If requireVerification is true and email is not verified, redirect to verification page
  if (requireVerification && !currentUser.emailVerified) {
    return <Navigate to="/verify-email" />;
  }

  // If user is logged in (and email is verified if required), render the children
  return <>{children}</>;
};

export default ProtectedRoute;
