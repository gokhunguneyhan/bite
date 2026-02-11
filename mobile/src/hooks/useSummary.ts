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
import { fetchFollowersCount } from '@/src/stores/userFollowStore';

export function useSummaries() {
  return useQuery({
    queryKey: ['summaries'],
    queryFn: fetchSummaries,
    staleTime: 30_000,
  });
}

export function useSummary(id: string) {
  return useQuery({
    queryKey: ['summary', id],
    queryFn: () => fetchSummary(id),
    enabled: !!id,
    staleTime: 5 * 60_000,
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
    staleTime: Infinity,
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
    staleTime: 60_000,
  });
}

export function useCommunitySummaries() {
  return useQuery({
    queryKey: ['community-summaries'],
    queryFn: fetchCommunitySummaries,
    staleTime: 60_000,
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
    staleTime: 60_000,
  });
}

export function useIsSubscribed(channelName: string) {
  return useQuery({
    queryKey: ['subscribed', channelName],
    queryFn: () => isSubscribed(channelName),
    enabled: !!channelName,
    staleTime: 60_000,
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

export function useFollowersCount() {
  return useQuery({
    queryKey: ['followers-count'],
    queryFn: fetchFollowersCount,
    staleTime: 60_000,
  });
}
