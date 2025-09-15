// User authentication hook - blueprint:javascript_log_in_with_replit
import { useQuery } from "@tanstack/react-query";
import { type User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user", {
        credentials: "include",
      });
      
      // Handle 401 (unauthorized) by returning null instead of throwing
      if (res.status === 401) {
        return null;
      }
      
      // Handle 429 (rate limit) by throwing with specific error
      if (res.status === 429) {
        const errorData = await res.json();
        throw new Error(`Rate limited: ${errorData.retryAfter}s`);
      }
      
      if (!res.ok) {
        const text = await res.text() || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
      
      return await res.json();
    },
    retry: false, // No retries to prevent infinite requests
    staleTime: 15 * 60 * 1000, // 15 minutes - significantly longer cache time
    gcTime: 30 * 60 * 1000, // 30 minutes cache time
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: false, // Don't refetch on component mount
    refetchInterval: false, // Disable automatic refetching
    refetchOnReconnect: false, // Don't refetch when reconnecting
    refetchIntervalInBackground: false, // Don't refetch in background
    networkMode: "online",
  });

  // Role checking utility functions
  const hasRole = (requiredRole: 'admin' | 'user'): boolean => {
    if (!user || !user.role) return false;
    
    // Admin users have access to both admin and user roles
    if (user.role === 'admin') return true;
    
    // User role only has access to user-level content
    return user.role === requiredRole;
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  const isUser = (): boolean => {
    return user?.role === 'user';
  };

  const canAccess = (requiredRole?: 'admin' | 'user'): boolean => {
    if (!requiredRole) return !!user; // Any authenticated user
    return hasRole(requiredRole);
  };

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    error,
    // Role checking functions
    hasRole,
    isAdmin,
    isUser,
    canAccess
  };
}