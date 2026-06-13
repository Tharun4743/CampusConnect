import { useQuery } from '@tanstack/react-query';
import placementService from "../lib/placementService";

export const usePlacementStatus = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['placement-status'],
    queryFn: () => placementService.getPlacementStatus(),
    staleTime: 60 * 1000,
  });

  const placement = data || null;
  const isPlaced = !!placement?.placementRecord;

  return {
    placement,
    isPlaced,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch,
  };
};
