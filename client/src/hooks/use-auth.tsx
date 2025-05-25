import React, { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, InsertUser } from "@shared/schema";
import { getQueryFn, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, InsertUser>;
  isFavorite: (showId: number) => Promise<boolean>;
  toggleFavorite: (showId: number) => Promise<void>;
  isAdmin: boolean;
  isApproved: boolean;
};

interface LoginData {
  identifier: string; // Can be either email or username
  password: string;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  // Check if we have stored authentication state
  const hasStoredAuth = () => {
    try {
      const storedAuth = localStorage.getItem('tvtantrum_auth');
      if (!storedAuth) return false;
      
      const authData = JSON.parse(storedAuth);
      
      // Check if the stored auth is valid (less than 24 hours old)
      if (authData.isLoggedIn && authData.timestamp) {
        const storedTime = new Date(authData.timestamp);
        const now = new Date();
        const hoursDiff = (now.getTime() - storedTime.getTime()) / (1000 * 60 * 60);
        
        return hoursDiff < 24; // Valid if less than 24 hours old
      }
      return false;
    } catch (e) {
      console.error('Error reading stored auth:', e);
      return false;
    }
  };
  
  // Check for stored authentication on mount
  useEffect(() => {
    if (hasStoredAuth()) {
      console.log("Detected stored auth but no user, trying to refetch...");
    } else {
      console.log("Landing page loaded, cleared authentication data from localStorage");
      localStorage.removeItem('tvtantrum_auth');
    }
  }, []);

  // Fetch current user data
  const {
    data: user,
    error,
    isLoading,
    refetch
  } = useQuery<User | null, Error>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      if (hasStoredAuth()) {
        console.log("Found valid stored auth, waiting for user data...");
      }
      
      try {
        const res = await fetch("/api/auth/user", {
          credentials: "include",
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            return null;
          }
          throw new Error("Failed to fetch user");
        }
        
        return await res.json();
      } catch (err) {
        console.error("Error fetching user data:", err);
        return null;
      }
    },
    // This ensures we never have undefined, only null for unauthenticated users
    select: (data) => data ?? null,
    // Initialize with null (not authenticated)
    initialData: null,
    // Always fetch on mount to ensure we have latest auth state
    enabled: true,
    // If auth token is invalid, retry a few times before giving up
    retry: 3,
    // Refresh user data every 5 minutes
    refetchInterval: 5 * 60 * 1000,
    // Use credentials in fetch
    refetchOnWindowFocus: true,
    // Don't refetch on mount
    refetchOnMount: true
  });
  
  // Effect to manage authentication state
  useEffect(() => {
    // If there's an auth error, clear localStorage
    if (error && (error.message === "Not authenticated" || error.message?.includes("401"))) {
      localStorage.removeItem('tvtantrum_auth');
    }
    
    // If we have stored auth but no user, try to refetch user data
    const checkAndRefetchAuth = async () => {
      try {
        if (hasStoredAuth() && !user && !isLoading) {
          console.log("Detected stored auth but no user, trying to refetch...");
          await refetch();
        }
      } catch (err) {
        console.error("Error refetching user data:", err);
      }
    };
    
    checkAndRefetchAuth();
  }, [error, user, isLoading, refetch]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
          credentials: "include"
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          console.log('Login error response:', errorData);
          
          // Create a custom error object with properties for approval status
          const error = new Error(errorData.message || "Login failed");
          // @ts-ignore - Adding custom property
          error.isPendingApproval = errorData.isPendingApproval || errorData.message?.includes("pending approval") || false;
          throw error;
        }
        
        return await res.json();
      } catch (err) {
        console.log('Login mutation caught error:', err);
        throw err;
      }
    },
    onSuccess: (user: User) => {
      console.log('Login successful, user:', user.id);
      
      // Store authentication state in localStorage to maintain login across page refreshes
      localStorage.setItem('tvtantrum_auth', JSON.stringify({
        isLoggedIn: true,
        userId: user.id,
        timestamp: new Date().toISOString()
      }));
      
      // Update React Query cache with user data
      queryClient.setQueryData(["/api/auth/user"], user);
      
      // Navigate to user dashboard without refreshing the page
      setTimeout(() => {
        window.location.href = '/user-dashboard';
      }, 500);
    },
    onError: (error: Error) => {
      // Clear any stale auth data
      localStorage.removeItem('tvtantrum_auth');
      
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include"
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        if (errorData && errorData.message) {
          throw new Error(errorData.message);
        }
        throw new Error("Registration failed");
      }
      
      return await res.json();
    },
    onSuccess: (user: User) => {
      // Store authentication state in localStorage
      localStorage.setItem('tvtantrum_auth', JSON.stringify({
        isLoggedIn: true,
        timestamp: new Date().toISOString()
      }));
      
      // Update React Query cache with user data
      queryClient.setQueryData(["/api/auth/user"], user);
      
      // Trigger a refetch to ensure we have the latest user data
      refetch();
    },
    onError: (error: Error) => {
      // Clear any stale auth data
      localStorage.removeItem('tvtantrum_auth');
      
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include"
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Logout failed");
      }
    },
    onSuccess: () => {
      // Clear authentication data from localStorage
      localStorage.removeItem('tvtantrum_auth');
      
      // Update React Query cache
      queryClient.setQueryData(["/api/auth/user"], null);
      
      // Invalidate any query keys that depend on user authentication
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if a show is in user's favorites
  const isFavorite = async (showId: number): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const res = await fetch(`/api/favorites/${showId}`, {
        credentials: "include"
      });
      
      if (!res.ok) {
        return false;
      }
      
      const data = await res.json();
      return data.isFavorite;
    } catch (error) {
      console.error("Error checking favorite status:", error);
      return false;
    }
  };

  // Toggle favorite status for a show
  const toggleFavorite = async (showId: number): Promise<void> => {
    if (!user) {
      throw new Error("User must be logged in to manage favorites");
    }
    
    // Check current favorite status
    const isFav = await isFavorite(showId);
    
    if (isFav) {
      // If already favorited, remove from favorites
      const res = await fetch(`/api/favorites/${showId}`, {
        method: "DELETE",
        credentials: "include"
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to remove from favorites");
      }
    } else {
      // If not favorited, add to favorites
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tvShowId: showId }),
        credentials: "include"
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to add to favorites");
      }
    }
    
    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    
    // Also invalidate the dashboard query to update the favorites list in real-time
    queryClient.invalidateQueries({ queryKey: ["/api/user/dashboard"] });
  };

  // Check if the user has admin privileges
  const isAdmin = user?.isAdmin === true;
  
  // Check if the user is approved
  const isApproved = user?.isApproved === true;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        isFavorite,
        toggleFavorite,
        isAdmin,
        isApproved,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}