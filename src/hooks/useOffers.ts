import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import offerService from "../lib/offerService";

export interface IOffer {
  id: string;
  status: string;
  [key: string]: any;
}

export const useOffers = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['offers'],
    queryFn: () => offerService.getMyOffers(),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const rawData = data?.data || data || [];
  const offers: IOffer[] = Array.isArray(rawData) ? rawData : [];

  const acceptMutation = useMutation({
    mutationFn: (id: string) => offerService.acceptOffer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => offerService.declineOffer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
  });

  return {
    offers,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    acceptOffer: (id: string) => acceptMutation.mutateAsync(id),
    rejectOffer: (id: string) => rejectMutation.mutateAsync(id),
    refetch: () => queryClient.invalidateQueries({ queryKey: ['offers'] }),
  };
};
