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

// Registration form component
function RegisterForm({ 
  onSuccess,
  earlyAccessToken
}: { 
  onSuccess: () => void; 
  earlyAccessToken: string | null;
}) {
  const { registerMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [usernameStatus, setUsernameStatus] = useState<'checking' | 'available' | 'taken' | null>(null);
  const [usernameValue, setUsernameValue] = useState("");

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Username availability check
  useEffect(() => {
    // Don't check if username is less than 3 characters
    if (!usernameValue || usernameValue.length < 3) {
      setUsernameStatus(null);
      return;
    }
    
    // Set status to checking before API call
    setUsernameStatus('checking');
    
    // Debounce the API call - only make it after user stops typing
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/check-username?username=${encodeURIComponent(usernameValue)}`);
        const data = await response.json();
        setUsernameStatus(data.available ? 'available' : 'taken');
      } catch (error) {
        console.error('Failed to check username availability:', error);
        setUsernameStatus(null);
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [usernameValue]);

  const onSubmit = (data: RegisterFormValues) => {
    // Check username availability before submitting
    if (usernameStatus === 'taken') {
      toast({
        title: "Username already taken",
        description: "Please choose a different username.",
        variant: "destructive",
      });
      return;
    }
    
    // If username is still being checked, wait for the check to complete
    if (usernameStatus === 'checking') {
      toast({
        title: "Please wait",
        description: "We're still checking if your username is available.",
      });
      return;
    }
    
    // Make sure we have a valid early access token
    if (!earlyAccessToken || earlyAccessToken !== "2025") {
      toast({
        title: "Early access token missing",
        description: "You need a valid early access token to register.",
        variant: "destructive",
      });
      return;
    }
    
    // Remove confirmPassword as it's not needed for the API
    const { confirmPassword, ...registerData } = data;
    
    registerMutation.mutate(registerData, {
      onSuccess: () => {
        toast({
          title: "Registration successful!",
          description: "Your account is pending approval.",
        });
        navigate("/registration-pending");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Register to save your favorite shows and more
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        type="text"
                        placeholder="Choose a username"
                        {...field}
                        disabled={registerMutation.isPending}
                        onChange={(e) => {
                          field.onChange(e);
                          setUsernameValue(e.target.value);
                        }}
                      />
                    </FormControl>
                    {usernameStatus && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {usernameStatus === 'checking' && (
                          <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-r-transparent" />
                        )}
                        {usernameStatus === 'available' && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                        {usernameStatus === 'taken' && (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="Enter your email address"
                      {...field}
                      disabled={registerMutation.isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    We'll never share your email with anyone else
                  </FormDescription>
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
                      placeholder="Create a password"
                      {...field}
                      disabled={registerMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Confirm your password"
                      {...field}
                      disabled={registerMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Registering..." : "Register"}
            </Button>
          </form>
        </Form>
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

  // Check if there's stored authentication on page load
  useEffect(() => {
    const checkStoredAuth = () => {
      try {
        const storedAuth = localStorage.getItem('tvtantrum_auth');
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          
          // Check if the stored auth is valid (less than 24 hours old)
          if (authData.isLoggedIn && authData.timestamp) {
            const storedTime = new Date(authData.timestamp);
            const now = new Date();
            const hoursDiff = (now.getTime() - storedTime.getTime()) / (1000 * 60 * 60);
            
            if (hoursDiff < 24) {
              console.log("Found valid stored auth, waiting for user data...");
              return true;
            }
          }
        }
        return false;
      } catch (error) {
        console.error('Error checking stored auth:', error);
        return false;
      }
    };
    
    const hasStoredAuth = checkStoredAuth();
    setIsCheckingStoredAuth(hasStoredAuth);
    
    // Auto-redirect if not checking stored auth
    if (!hasStoredAuth) {
      setIsCheckingStoredAuth(false);
    }
    
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
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-5 w-5 text-primary mt-1" />
              <p>Compare shows by stimulation scores</p>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-5 w-5 text-primary mt-1" />
              <p>Filter by age range and interests</p>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-5 w-5 text-primary mt-1" />
              <p>Save favorites and get personalized recommendations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}