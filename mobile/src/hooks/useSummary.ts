import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSummaries,
  fetchSummary,
  fetchCachedTranslation,
  fetchCommunitySummaries,
  togglePublish,
  generateSummary,
  deleteSummary,
  fetchSummariesByChannel,
  translateSummary,
} from '@/src/services/summaryService';
import {
  fetchSubscriptions,
  subscribeToCreator,
  unsubscribeFromCreator,
  isSubscribed,
} from '@/src/services/creatorService';
import { importYouTubeSubscriptions } from '@/src/services/youtubeImportService';

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

export function useCommunitySummaries() {
  return useQuery({
    queryKey: ['community-summaries'],
    queryFn: fetchCommunitySummaries,
  });
}

export function useTogglePublish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      togglePublish(id, isPublic),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['summaries'] });
      queryClient.invalidateQueries({ queryKey: ['community-summaries'] });
      queryClient.invalidateQueries({ queryKey: ['summary', id] });
    },
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

export function useSubscriptions() {
  return useQuery({
    queryKey: ['subscriptions'],
    queryFn: fetchSubscriptions,
  });
}

export function useIsSubscribed(channelName: string) {
  return useQuery({
    queryKey: ['subscribed', channelName],
    queryFn: () => isSubscribed(channelName),
    enabled: !!channelName,
  });
}

export function useSubscribe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelName: string) => subscribeToCreator(channelName),
    onSuccess: (_data, channelName) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.setQueryData(['subscribed', channelName], true);
    },
  });
}

export function useUnsubscribe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelName: string) => unsubscribeFromCreator(channelName),
    onSuccess: (_data, channelName) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.setQueryData(['subscribed', channelName], false);
    },
  });
}

export function useImportYouTubeSubscriptions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importYouTubeSubscriptions,
    onSuccess: (imported) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      for (const sub of imported) {
        queryClient.setQueryData(['subscribed', sub.channelName], true);
      }
    },
  });
}
