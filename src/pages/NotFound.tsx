
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-industrial-background">
      <div className="text-center max-w-md p-6">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-amber-100 rounded-full">
            <AlertTriangle className="h-12 w-12 text-industrial-amber" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-industrial-blue mb-4">404</h1>
        <p className="text-xl text-industrial-text mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button 
          className="bg-industrial-teal hover:bg-industrial-teal/90" 
          asChild
        >
          <a href="/">Return to Dashboard</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
