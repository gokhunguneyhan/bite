import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSummaries,
  fetchSummary,
  generateSummary,
  deleteSummary,
  fetchSummariesByChannel,
} from '@/src/services/summaryService';
import { useSettingsStore } from '@/src/stores/settingsStore';

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
  const language = useSettingsStore((s) => s.language);

  return useMutation({
    mutationFn: (videoId: string) => generateSummary(videoId, language),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summaries'] });
    },
  });
}

export function useChannelSummaries(channelName: string) {
  return useQuery({
    queryKey: ['channelSummaries', channelName],
    queryFn: () => fetchSummariesByChannel(channelName),
    enabled: !!channelName,
  });
}

export function useDeleteSummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSummary(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summaries'] });
    },
  });
}
