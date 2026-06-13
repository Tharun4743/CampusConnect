import { useQuery } from '@tanstack/react-query';
import interviewService from "../lib/interviewService";

export interface IInterview {
  id: string;
  scheduled_at: string;
  status: string;
  [key: string]: any;
}

export const useInterviews = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['interviews'],
    queryFn: () => interviewService.getMyInterviews(),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const rawData = data?.data || data || [];
  const interviews: IInterview[] = Array.isArray(rawData) ? rawData : [];
  const now = new Date();
  const upcomingCount = interviews.filter(
    i => new Date(i.scheduled_at) > now && i.status !== "completed"
  ).length;

  return {
    interviews,
    upcomingCount,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch,
  };
};
