import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function TokenEntryPage() {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const expectedToken = "2025";

  // If user is already logged in, redirect to home
  useEffect(() => {
    if (user) {
      setLocation("/home");
    }
  }, [user, setLocation]);

  // Enable automatic redirect when a valid token exists
  useEffect(() => {
    const storedToken = localStorage.getItem("earlyAccessToken");
    if (storedToken === expectedToken) {
      // Redirect to home page when token is already stored
      setLocation("/home");
    }
  }, [setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API check with a timeout
    setTimeout(() => {
      if (token.trim().toLowerCase() === expectedToken.toLowerCase()) {
        // Store token in localStorage for persistence
        localStorage.setItem("earlyAccessToken", expectedToken);
        toast({
          title: "Success!",
          description: "Your access token has been verified. Welcome to TV Tantrum!",
          variant: "default"
        });
        // Redirect to home page after successful verification
        setLocation("/home");
      } else {
        toast({
          title: "Invalid Token",
          description: "The token you entered is not valid. Please check and try again.",
          variant: "destructive"
        });
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-primary-800 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Welcome to TV Tantrum</CardTitle>
          <CardDescription>
            The waiting list is now closed. Enter your exclusive access token to continue.
          </CardDescription>
          <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mt-4">
            <p className="text-sm text-orange-800">
              <strong>Waiting List Closed:</strong> We've reached 5,000 members! If you have a token code, enter it below to access the platform.
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">What you get with TV Tantrum:</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Smart stimulation scores to find the right content intensity</li>
              <li>• Advanced filtering by age, themes, and sensory details</li>
              <li>• Community reviews from real parents</li>
              <li>• Personalized recommendations based on your preferences</li>
              <li>• Access to 500+ curated children's shows and channels</li>
            </ul>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                id="token"
                placeholder="Enter your access token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !token.trim()}
            >
              {isLoading ? "Verifying..." : "Verify Token"}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              <span className="hover:underline cursor-pointer" onClick={() => setLocation("/about")}>
                Learn more about TV Tantrum
              </span>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}