import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Summary } from '@/src/types/summary';

interface OfflineState {
  /** Cached summaries keyed by ID */
  summaries: Record<string, Summary>;
  /** Cache a summary for offline access */
  cacheSummary: (summary: Summary) => void;
  /** Get a cached summary */
  getCachedSummary: (id: string) => Summary | undefined;
  /** Remove a cached summary */
  removeCachedSummary: (id: string) => void;
  /** Check if a summary is cached */
  isCached: (id: string) => boolean;
  /** Get all cached summary IDs */
  cachedIds: () => string[];
  clear: () => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      summaries: {},
      cacheSummary: (summary) =>
        set((state) => ({
          summaries: { ...state.summaries, [summary.id]: summary },
        })),
      getCachedSummary: (id) => get().summaries[id],
      removeCachedSummary: (id) =>
        set((state) => {
          const { [id]: _, ...rest } = state.summaries;
          return { summaries: rest };
        }),
      isCached: (id) => id in get().summaries,
      cachedIds: () => Object.keys(get().summaries),
      clear: () => set({ summaries: {} }),
    }),
    {
      name: '@bite_offline_summaries',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
