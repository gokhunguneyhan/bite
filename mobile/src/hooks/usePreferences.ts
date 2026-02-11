import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPreferences,
  savePreferences,
  hasCompletedOnboarding,
} from '@/src/services/preferencesService';

export function usePreferences() {
  return useQuery({
    queryKey: ['preferences'],
    queryFn: fetchPreferences,
    staleTime: 5 * 60_000,
  });
}

export function useOnboardingStatus() {
  return useQuery({
    queryKey: ['onboarding-status'],
    queryFn: hasCompletedOnboarding,
    staleTime: Infinity,
  });
}

export function useSavePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: savePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
    },
  });
}
