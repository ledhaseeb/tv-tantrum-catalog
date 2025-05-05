import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res.json();
}

export async function apiGet<T = any>(url: string): Promise<T> {
  return apiRequest<T>('GET', url);
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Handle basic URL vs. URL with filters
    let url = queryKey[0] as string;
    
    // If there are filters in the second element of the queryKey
    if (queryKey.length > 1 && typeof queryKey[1] === 'object' && queryKey[1] !== null) {
      const filters = queryKey[1] as Record<string, any>;
      
      // Build query parameters 
      if (Object.keys(filters).length > 0) {
        const searchParams = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              searchParams.append(key, value.join(','));
            } else if (typeof value === 'object') {
              // For objects like stimulationScoreRange
              searchParams.append(key, JSON.stringify(value));
            } else {
              searchParams.append(key, String(value));
            }
          }
        });
        
        // Append query string to URL
        const queryString = searchParams.toString();
        if (queryString) {
          url = `${url}?${queryString}`;
          console.log('Debug - URL with filters:', url);
        }
      }
    }
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
