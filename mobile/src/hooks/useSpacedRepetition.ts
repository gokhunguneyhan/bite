import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDueCards,
  fetchAllScheduledCards,
  scheduleCard,
  unscheduleCard,
  reviewCard,
  isCardScheduled,
} from '@/src/services/spacedRepetitionService';

export function useDueCards() {
  return useQuery({
    queryKey: ['due-cards'],
    queryFn: fetchDueCards,
  });
}

export function useScheduledCards() {
  return useQuery({
    queryKey: ['scheduled-cards'],
    queryFn: fetchAllScheduledCards,
  });
}

export function useScheduleCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ summaryId, cardId }: { summaryId: string; cardId: string }) =>
      scheduleCard(summaryId, cardId),
    onSuccess: (_data, { summaryId, cardId }) => {
      queryClient.invalidateQueries({ queryKey: ['due-cards'] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-cards'] });
      queryClient.invalidateQueries({
        queryKey: ['card-scheduled', summaryId, cardId],
      });
    },
  });
}

export function useUnscheduleCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ summaryId, cardId }: { summaryId: string; cardId: string }) =>
      unscheduleCard(summaryId, cardId),
    onSuccess: (_data, { summaryId, cardId }) => {
      queryClient.invalidateQueries({ queryKey: ['due-cards'] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-cards'] });
      queryClient.invalidateQueries({
        queryKey: ['card-scheduled', summaryId, cardId],
      });
    },
  });
}

export function useReviewCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      summaryId,
      cardId,
      quality,
    }: {
      summaryId: string;
      cardId: string;
      quality: 0 | 1 | 2 | 3 | 4 | 5;
    }) => reviewCard(summaryId, cardId, quality),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['due-cards'] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-cards'] });
    },
  });
}

export function useIsCardScheduled(summaryId: string, cardId: string) {
  return useQuery({
    queryKey: ['card-scheduled', summaryId, cardId],
    queryFn: () => isCardScheduled(summaryId, cardId),
    enabled: !!summaryId && !!cardId,
  });
}
