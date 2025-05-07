import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, InsertUser } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
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
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  // Get the current user
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/user");
        return await res.json();
      } catch (error) {
        if (error instanceof Response && error.status === 401) {
          return null;
        }
        throw error;
      }
    }
  });

  // Check if user is admin for color palette access
  const { data: adminData } = useQuery<{isAdmin: boolean}, Error>({
    queryKey: ["/api/user/is-admin"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/user/is-admin");
        return await res.json();
      } catch (error) {
        if (error instanceof Response && error.status === 401) {
          return { isAdmin: false };
        }
        throw error;
      }
    },
    enabled: !!user, // Only run if user is logged in
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Registration failed");
      }
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
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
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
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
      const res = await apiRequest("GET", `/api/favorites/${showId}`);
      const data = await res.json();
      return data.isFavorite;
    } catch (error) {
      console.error("Error checking favorite status:", error);
      return false;
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (showId: number): Promise<void> => {
    if (!user) {
      // If not logged in, redirect to auth page
      window.location.href = "/auth";
      return;
    }

    try {
      // Check current favorite status
      const isFav = await isFavorite(showId);

      if (isFav) {
        // Remove from favorites
        await apiRequest("DELETE", `/api/favorites/${showId}`);
        toast({
          title: "Removed from favorites",
          description: "Show removed from your favorites.",
        });
      } else {
        // Add to favorites
        await apiRequest("POST", "/api/favorites", { tvShowId: showId });
        toast({
          title: "Added to favorites",
          description: "Show added to your favorites.",
        });
      }

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${showId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        isFavorite,
        toggleFavorite,
        isAdmin: adminData?.isAdmin || false
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