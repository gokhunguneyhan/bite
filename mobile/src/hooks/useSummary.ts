import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSummaries,
  fetchSummary,
  fetchCachedTranslation,
  generateSummary,
  deleteSummary,
  fetchSummariesByChannel,
  translateSummary,
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

export function useCachedTranslation(
  summaryId: string | undefined,
  language: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['cachedTranslation', summaryId, language],
    queryFn: () => fetchCachedTranslation(summaryId!, language),
    enabled: enabled && !!summaryId,
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

export function useTranslateSummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ summaryId, targetLanguage }: { summaryId: string; targetLanguage: string }) =>
      translateSummary(summaryId, targetLanguage),
    onSuccess: (data, { summaryId, targetLanguage }) => {
      queryClient.setQueryData(['cachedTranslation', summaryId, targetLanguage], data);
    },
  });
}
