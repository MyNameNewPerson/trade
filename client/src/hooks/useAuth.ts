// User authentication hook - blueprint:javascript_log_in_with_replit
import { useQuery } from "@tanstack/react-query";
import { type User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
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
    retry: (failureCount, error) => {
      // Don't retry on rate limit errors
      if (error?.message?.includes('Rate limited')) {
        return false;
      }
      return failureCount < 1;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - longer to reduce requests
    gcTime: 30 * 60 * 1000, // 30 minutes cache time
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on mount, use cache
    refetchInterval: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error
  };
}