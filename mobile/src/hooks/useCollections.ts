import { useQuery } from '@tanstack/react-query';
import {
  fetchCollections,
  fetchCollectionWithItems,
} from '@/src/services/collectionService';

export function useCollections() {
  return useQuery({
    queryKey: ['collections'],
    queryFn: fetchCollections,
    staleTime: 2 * 60_000,
  });
}

export function useCollection(id: string) {
  return useQuery({
    queryKey: ['collection', id],
    queryFn: () => fetchCollectionWithItems(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}
