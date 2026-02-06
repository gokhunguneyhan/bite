import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSummaries,
  fetchSummary,
  generateSummary,
} from '@/src/services/summaryService';

export function useSummaries() {
  return useQuery({
    queryKey: ['summaries'],
    queryFn: fetchSummaries,
  });
}

export function useSummary(id: string) {
  return useQuery({
    queryKey: ['summary', id],
    queryFn: () => fetchSummary(id),
    enabled: !!id,
  });
}

export function useGenerateSummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (videoId: string) => generateSummary(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summaries'] });
    },
  });
}
