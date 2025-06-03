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
      
      {/* Benefits section below the card */}
      <div className="w-full max-w-lg space-y-4 mt-6">
        <div className="bg-gray-50 border border-gray-200 rounded-md p-6 min-h-[320px] flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upon entry you will be able to:</h3>
          <ul className="text-sm text-gray-700 space-y-2 mb-6">
            <li>- Browse and search all TV shows</li>
            <li>- View stimulation scores and details</li>
            <li>- Compare shows side-by-side</li>
            <li>- See reviews</li>
          </ul>
          
          <p className="text-sm text-gray-800 font-medium mb-4">
            However, we encourage you to register for free for all these added benefits
          </p>
          
          <ul className="text-sm text-blue-800 space-y-2 mb-4 flex-grow">
            <li>• Select favourites for personalized recommendations</li>
            <li>• Submit shows for analysis and build our database</li>
            <li>• Access research articles</li>
            <li>• Rate shows and leave reviews</li>
          </ul>
          
          <p className="text-sm text-blue-700 font-medium mt-auto">
            Become a contributor to the TV Tantrum project and help make screen time safer for families
          </p>
        </div>
      </div>
    </div>
  );
}