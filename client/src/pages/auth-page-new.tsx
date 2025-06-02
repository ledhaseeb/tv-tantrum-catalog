import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CheckCircle2, XCircle } from "lucide-react";

// Schema for login form
const loginSchema = z.object({
  identifier: z.string().min(3, "Please enter a valid email or username"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Schema for registration form with additional fields
const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

// Login form component
function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { loginMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Login successful!",
          description: "Welcome back to TV Tantrum",
        });
        onSuccess();
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email or Username</FormLabel>
                  <FormControl>
                    <Input 
                      type="text"
                      placeholder="Enter your email or username"
                      {...field}
                      disabled={loginMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Enter your password"
                      {...field}
                      disabled={loginMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// GHL Registration form component
function RegisterForm({ 
  onSuccess,
  earlyAccessToken
}: { 
  onSuccess: () => void; 
  earlyAccessToken: string | null;
}) {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Listen for GHL form completion
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'GHL_FORM_COMPLETED') {
        toast({
          title: "Email Verification Sent!",
          description: "Please check your email and click the verification link to continue.",
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Register to save your favorite shows and more
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Fill out the form below to get started. After email verification, you'll create your username and password.
          </p>
          
          {/* Go High Level Form Embed */}
          <div className="w-full min-h-[632px] border rounded-lg">
            <iframe
              src="https://api.leadconnectorhq.com/widget/form/k1oNtk7bxZaBfdLXDkek"
              className="w-full h-[632px] border-0 rounded-lg"
              id="inline-k1oNtk7bxZaBfdLXDkek" 
              data-layout="{'id':'INLINE'}"
              data-trigger-type="alwaysShow"
              data-trigger-value=""
              data-activation-type="alwaysActivated"
              data-activation-value=""
              data-deactivation-type="neverDeactivate"
              data-deactivation-value=""
              data-form-name="Registration form"
              data-height="632"
              data-layout-iframe-id="inline-k1oNtk7bxZaBfdLXDkek"
              data-form-id="k1oNtk7bxZaBfdLXDkek"
              title="Registration form"
            />
          </div>
          <script src="https://link.msgsndr.com/js/form_embed.js"></script>
          
          <div className="text-xs text-muted-foreground">
            <p>By registering, you agree to our terms of service and privacy policy.</p>
            <p className="mt-2">After email verification, you'll be redirected to complete your account setup.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [isCheckingStoredAuth, setIsCheckingStoredAuth] = useState(true);
  const [earlyAccessToken, setEarlyAccessToken] = useState<string | null>(null);
  
  // Handle successful authentication
  const handleAuthSuccess = useCallback(() => {
    if (user) {
      const redirectPath = user.isAdmin ? "/admin" : user.isApproved ? "/home" : "/registration-pending";
      navigate(redirectPath);
    }
  }, [navigate, user]);

  // Check if there's authentication on page load - rely on server session only
  useEffect(() => {
    // Skip localStorage checking, rely on server session
    setIsCheckingStoredAuth(false);
    
    // Check for early access token from URL
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      setEarlyAccessToken(urlToken);
      localStorage.setItem("earlyAccessToken", urlToken);
      
      // Switch to register tab when token is present
      if (urlToken === "2025") {
        setActiveTab("register");
      }
    } else {
      // Read token from localStorage if not in URL
      const storedToken = localStorage.getItem("earlyAccessToken");
      if (storedToken) {
        setEarlyAccessToken(storedToken);
        
        // Switch to register tab when token is present and valid
        if (storedToken === "2025") {
          setActiveTab("register");
        }
      }
    }
  }, []);
  
  // Check if user is already logged in
  useEffect(() => {
    // If we're done checking auth and have a user, redirect
    if (!isCheckingStoredAuth && user) {
      handleAuthSuccess();
    }
  }, [user, isCheckingStoredAuth, handleAuthSuccess]);
  
  // If still checking stored auth, show loading
  if (isCheckingStoredAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  // If we have user data, redirect (handled by useEffect)
  if (user) {
    const redirectPath = user.isAdmin ? "/admin" : user.isApproved ? "/home" : "/registration-pending";
    navigate(redirectPath);
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-5xl p-4 md:p-8 flex flex-col md:flex-row gap-8">
        {/* Auth forms column */}
        <div className="w-full md:w-1/2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm onSuccess={handleAuthSuccess} />
              <div className="text-sm text-muted-foreground mt-4 text-center">
                Don't have an account?{" "}
                <Button 
                  variant="link" 
                  className="p-0 h-auto" 
                  onClick={() => setActiveTab("register")}
                >
                  Register
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="register">
              <RegisterForm 
                onSuccess={handleAuthSuccess} 
                earlyAccessToken={earlyAccessToken} 
              />
              <div className="text-sm text-muted-foreground mt-4 text-center">
                Already have an account?{" "}
                <Button 
                  variant="link" 
                  className="p-0 h-auto" 
                  onClick={() => setActiveTab("login")}
                >
                  Login
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Hero content column */}
        <div className="w-full md:w-1/2 flex flex-col justify-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-primary">
            TV Tantrum
          </h1>
          <p className="text-xl text-muted-foreground">
            The ultimate guide for parents to understand the stimulation level of children's TV shows
          </p>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Free Features:</h3>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                  <p>Browse and search all TV shows</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                  <p>View stimulation scores and details</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                  <p>Compare shows side-by-side</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">Premium Features (Requires Account):</h3>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1" />
                  <p>Save favorites and create watchlists</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1" />
                  <p>Write and read detailed reviews</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1" />
                  <p>Access research summaries</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1" />
                  <p>Submit new shows for review</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}