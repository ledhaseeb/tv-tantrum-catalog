import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function RegistrationPendingPage() {
  const { logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Set early access token in localStorage when this page loads
  useEffect(() => {
    console.log("Registration pending page loaded, setting earlyAccessShown in localStorage");
    localStorage.setItem("earlyAccessShown", "true");
  }, []);
  
  // Function to handle logout and redirect to auth page
  const handleLogoutAndRedirect = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      // First, make sure the early access token is set in localStorage
      localStorage.setItem("earlyAccessToken", "tv-tantrum-early-2025");
      localStorage.setItem("earlyAccessShown", "true");
      
      // Log the user out
      await logoutMutation.mutateAsync();
      
      // Clean up any user data in localStorage
      localStorage.removeItem("tvtantrum_auth");
      
      // Redirect to auth page
      navigate("/auth");
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Error",
        description: "There was an error logging you out. Please try again.",
        variant: "destructive",
      });
    }
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Registration Pending</CardTitle>
          <CardDescription className="text-center">
            Your account has been created but requires admin approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 text-center">
          <div className="bg-primary/10 rounded-lg p-6 text-primary border border-primary/20">
            <p className="font-medium mb-2">Thank you for registering!</p>
            <p>
              Your TV Tantrum account has been created successfully and is now pending approval by our administrators.
            </p>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium">What happens next:</h3>
            <ul className="space-y-2 text-left list-disc pl-6">
              <li>Our team will review your registration request</li>
              <li>You'll receive an email notification once your account is approved</li>
              <li>After approval, you can log in with your credentials</li>
              <li>You'll have full access to all TV Tantrum features during our early access period</li>
            </ul>
          </div>
          
          <div className="bg-muted p-4 rounded-md text-muted-foreground text-sm">
            <p>
              Early access users help us improve TV Tantrum before our public launch. Your feedback will be invaluable!
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <div className="flex flex-col gap-3 w-full">
            <Button variant="default" asChild className="w-full">
              <Link href="/">Return to Home</Link>
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleLogoutAndRedirect}
            >
              Return to Login
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Have questions? Email us at <span className="text-primary font-medium">support@tvtantrum.com</span>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}