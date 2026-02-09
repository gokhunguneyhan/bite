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
  });
}

export function useOnboardingStatus() {
  return useQuery({
    queryKey: ['onboarding-status'],
    queryFn: hasCompletedOnboarding,
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
