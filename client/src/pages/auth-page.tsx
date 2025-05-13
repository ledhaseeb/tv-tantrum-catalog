import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, loginMutation, registerMutation } = useAuth();
  const [usernameStatus, setUsernameStatus] = useState<'checking' | 'available' | 'taken' | null>(null);
  const [usernameValue, setUsernameValue] = useState("");
  const [isCheckingStoredAuth, setIsCheckingStoredAuth] = useState(true);
  
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
      } catch (e) {
        console.error('Error checking stored auth:', e);
        return false;
      } finally {
        setIsCheckingStoredAuth(false);
      }
    };
    
    // Perform the check
    checkStoredAuth();
  }, []);
  
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
  
  // Helper function to get the redirect path from URL if available
  const getRedirectPath = () => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    return redirect ? decodeURIComponent(redirect) : '/';
  };

  // Display a loading state while checking authentication
  if (isCheckingStoredAuth) {
    return (
      <div className="container mx-auto flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  // Redirect if user is already logged in
  if (user) {
    navigate(getRedirectPath());
    return null;
  }

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle login submission

  function onLoginSubmit(data: LoginFormValues) {
    loginMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        navigate(getRedirectPath());
      },
      onError: (error: any) => {
        // Debug the error
        console.log('Login error in auth-page:', error.message, error);
        
        // Check if the error is about pending approval by looking at our custom property
        if (error.isPendingApproval || error.message.includes("pending approval")) {
          console.log('Detected pending approval, redirecting...');
          toast({
            title: "Account Pending Approval",
            description: "Your account has been created but requires admin approval.",
          });
          navigate("/registration-pending");
        } else {
          toast({
            title: "Login failed",
            description: error.message || "Please check your credentials and try again",
            variant: "destructive",
          });
        }
      },
    });
  }

  // Handle registration submission
  function onRegisterSubmit(data: RegisterFormValues) {
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
    
    // Remove confirmPassword as it's not needed for the API
    const { confirmPassword, ...registerData } = data;
    
    registerMutation.mutate(registerData, {
      onSuccess: () => {
        toast({
          title: "Registration successful",
          description: "Your account has been created and is pending approval.",
        });
        navigate("/registration-pending");
      },
      onError: (error) => {
        // If the error is about username already taken, update the usernameStatus
        if (error.message?.includes("Username already taken")) {
          setUsernameStatus('taken');
          toast({
            title: "Username already taken",
            description: "Please choose a different username.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Registration failed",
            description: error.message || "Please try again",
            variant: "destructive",
          });
        }
      },
    });
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row gap-6 max-w-6xl mx-auto">
        {/* Authentication Forms */}
        <div className="w-full md:w-1/2">
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            {/* Login Tab */}
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login to your account</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
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
                        control={loginForm.control}
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
                <CardFooter className="flex flex-col">
                  <div className="text-sm text-muted-foreground mt-2">
                    Don't have an account?{" "}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto" 
                      onClick={() => setActiveTab("register")}
                    >
                      Register
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Register Tab */}
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>
                    Register to save your favorite shows and more
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input 
                                  placeholder="Choose a display name"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    setUsernameValue(e.target.value);
                                  }}
                                  disabled={registerMutation.isPending}
                                  className={usernameStatus === 'taken' ? "pr-10 border-red-500 focus-visible:ring-red-500" : 
                                            usernameStatus === 'available' ? "pr-10 border-green-500 focus-visible:ring-green-500" : 
                                            "pr-10"}
                                />
                              </FormControl>
                              {usernameStatus === 'checking' && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <svg className="animate-spin h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                </div>
                              )}
                              {usernameStatus === 'available' && field.value.length >= 3 && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                </div>
                              )}
                              {usernameStatus === 'taken' && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <XCircle className="h-5 w-5 text-red-500" />
                                </div>
                              )}
                            </div>
                            {usernameStatus === 'taken' && (
                              <p className="text-sm font-medium text-red-500">
                                Username is already taken
                              </p>
                            )}
                            {usernameStatus === 'available' && field.value.length >= 3 && (
                              <p className="text-sm font-medium text-green-500">
                                Username is available
                              </p>
                            )}
                            <FormDescription>
                              This will be used for your reviews and comments
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
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
                        control={registerForm.control}
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
                        control={registerForm.control}
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
                        {registerMutation.isPending ? "Creating account..." : "Register"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col">
                  <div className="text-sm text-muted-foreground mt-2">
                    Already have an account?{" "}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto" 
                      onClick={() => setActiveTab("login")}
                    >
                      Login
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Hero Section */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-primary/90 to-primary/50 rounded-xl p-8 text-primary-foreground flex flex-col justify-center">
          <div>
            <h1 className="text-3xl font-bold mb-4">Welcome to the TV tantrum community</h1>
            <p className="mb-6 text-lg opacity-90">
              Join the revolution to transform the culture of children's TV
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <div className="bg-white/20 rounded-full p-1 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Save Your Favorites</h3>
                  <p className="opacity-75 text-sm">Create an account to bookmark and save your favorite shows for quick access later.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="bg-white/20 rounded-full p-1 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Get Personalized Recommendations</h3>
                  <p className="opacity-75 text-sm">We analyze your preferences to suggest shows that match your child's sensory profile.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="bg-white/20 rounded-full p-1 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Leave Reviews</h3>
                  <p className="opacity-75 text-sm">Share your experiences and help other parents by rating and reviewing shows you've watched.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}