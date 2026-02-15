import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchEditorsPickIds,
  checkIsAdmin,
  toggleEditorsPick,
} from '@/src/services/editorsPickService';
import { fetchSummary } from '@/src/services/summaryService';
import type { Summary } from '@/src/types/summary';

export function useIsAdmin() {
  return useQuery({
    queryKey: ['is-admin'],
    queryFn: checkIsAdmin,
    staleTime: 5 * 60_000,
  });
}

export function useEditorsPickIds() {
  return useQuery({
    queryKey: ['editors-pick-ids'],
    queryFn: fetchEditorsPickIds,
    staleTime: 60_000,
  });
}

export function useEditorsPicks() {
  const { data: pickIds } = useEditorsPickIds();

  return useQuery({
    queryKey: ['editors-picks', pickIds],
    queryFn: async (): Promise<Summary[]> => {
      if (!pickIds || pickIds.length === 0) return [];
      const summaries = await Promise.all(
        pickIds.map((id) => fetchSummary(id).catch(() => null)),
      );
      return summaries.filter(Boolean) as Summary[];
    },
    enabled: !!pickIds && pickIds.length > 0,
    staleTime: 60_000,
  });
}

export function useToggleEditorsPick() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleEditorsPick,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editors-pick-ids'] });
      queryClient.invalidateQueries({ queryKey: ['editors-picks'] });
    },
  });
}
