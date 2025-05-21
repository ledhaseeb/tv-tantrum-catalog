import { useAuth } from "@/hooks/useAuth";
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
      // With Replit auth, users are automatically approved
  }, [toast]);

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // If not logged in, redirect to login
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/api/login" />
      </Route>
    );
  }

  // If logged in and approved, show the component
  return <Route path={path}><Component /></Route>;
}