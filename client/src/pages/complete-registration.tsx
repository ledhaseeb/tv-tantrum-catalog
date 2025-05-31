import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";

const completeRegistrationSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type CompleteRegistrationForm = z.infer<typeof completeRegistrationSchema>;

export default function CompleteRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Function to get email from URL parameters or localStorage
  const getPrefilledEmail = () => {
    // Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const emailFromUrl = urlParams.get('email');
    if (emailFromUrl) {
      return emailFromUrl;
    }

    // Check localStorage for GHL form data
    const ghlEmail = localStorage.getItem('ghl_user_email');
    if (ghlEmail) {
      return ghlEmail;
    }

    return "";
  };

  const form = useForm<CompleteRegistrationForm>({
    resolver: zodResolver(completeRegistrationSchema),
    defaultValues: {
      email: getPrefilledEmail(),
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Update form when component mounts or URL changes
  useEffect(() => {
    const prefilledEmail = getPrefilledEmail();
    if (prefilledEmail && prefilledEmail !== form.getValues('email')) {
      form.setValue('email', prefilledEmail);
    }
  }, [form]);

  const onSubmit = async (data: CompleteRegistrationForm) => {
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest("POST", "/api/complete-registration", {
        email: data.email,
        username: data.username,
        password: data.password,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      setIsComplete(true);
      toast({
        title: "Registration Completed!",
        description: "Your account has been created successfully. You can now sign in.",
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        setLocation("/auth");
      }, 2000);

    } catch (error: any) {
      console.error("Registration completion error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "Unable to complete registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">Welcome to TV Tantrum!</CardTitle>
            <CardDescription>
              Your account has been created successfully. Redirecting you to sign in...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Complete Your Registration</CardTitle>
          <CardDescription className="text-center">
            Your email has been verified! Now create your username and password to access TV Tantrum.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Enter your verified email" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Choose a unique username" 
                        {...field} 
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
                        placeholder="Create a secure password" 
                        {...field} 
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Registration
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}