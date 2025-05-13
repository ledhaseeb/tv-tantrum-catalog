import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export function ApprovedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // If user is logged in but not approved, show toast and redirect
    if (user && user.isApproved === false) {
      toast({
        title: "Access Denied",
        description: "Your account is pending approval by an administrator.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // If not logged in, redirect to auth page
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // If logged in but not approved, redirect to pending page
  if (user.isApproved === false) {
    return (
      <Route path={path}>
        <Redirect to="/registration-pending" />
      </Route>
    );
  }

  // If logged in and approved, show the component
  return <Route path={path}><Component /></Route>;
}