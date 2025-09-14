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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    refetchOnReconnect: false,
    networkMode: "online",
  });

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    error
  };
}