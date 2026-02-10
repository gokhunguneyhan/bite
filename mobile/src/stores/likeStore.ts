import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LikeStore {
  likedIds: Set<string>;
  isLiked: (id: string) => boolean;
  toggleLike: (id: string) => void;
  clear: () => void;
}

export const useLikeStore = create<LikeStore>()(
  persist(
    (set, get) => ({
      likedIds: new Set<string>(),
      isLiked: (id: string) => get().likedIds.has(id),
      toggleLike: (id: string) => {
        const next = new Set(get().likedIds);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        set({ likedIds: next });
      },
      clear: () => set({ likedIds: new Set<string>() }),
    }),
    {
      name: 'like-store',
      storage: createJSONStorage(() => AsyncStorage, {
        replacer: (_key, value) =>
          value instanceof Set ? [...value] : value,
        reviver: (key, value) =>
          key === 'likedIds' && Array.isArray(value) ? new Set(value) : value,
      }),
    },
  ),
);
