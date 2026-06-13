import { useQuery } from '@tanstack/react-query';
import { getDashboard } from "../lib/dashboardService";

export function useDashboard() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: async () => {
      const res = await getDashboard();
      if (!res.success) {
        throw new Error(res.message || "Failed to load dashboard");
      }
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
  });

  return { 
    data, 
    loading: isLoading, 
    error: error instanceof Error ? error.message : error ? String(error) : null, 
    refetch 
  };
}
