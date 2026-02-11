import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserFollow {
  userId: string;
  displayName: string;
  analysisCount: number;
  followedAt: string;
}

// TODO: Create when ready for server-side user follows
// CREATE TABLE user_follows (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   follower_id UUID REFERENCES profiles(id),
//   following_id UUID REFERENCES profiles(id),
//   created_at TIMESTAMPTZ DEFAULT now()
// );

interface UserFollowState {
  follows: UserFollow[];
  followUser: (data: Omit<UserFollow, 'followedAt'>) => void;
  unfollowUser: (userId: string) => void;
  isFollowingUser: (userId: string) => boolean;
  clear: () => void;
}

export const useUserFollowStore = create<UserFollowState>()(
  persist(
    (set, get) => ({
      follows: [],
      followUser: (data) => {
        if (get().follows.some((f) => f.userId === data.userId)) return;
        set((state) => ({
          follows: [
            { ...data, followedAt: new Date().toISOString() },
            ...state.follows,
          ],
        }));
      },
      unfollowUser: (userId) => {
        set((state) => ({
          follows: state.follows.filter((f) => f.userId !== userId),
        }));
      },
      isFollowingUser: (userId) => {
        return get().follows.some((f) => f.userId === userId);
      },
      clear: () => set({ follows: [] }),
    }),
    {
      name: '@bite_user_follows',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/**
 * Fetch the number of users following the current user from Supabase.
 * Returns 0 if the table doesn't exist yet or on any error.
 */
export async function fetchFollowersCount(): Promise<number> {
  const { supabase } = await import('@/src/lib/supabase');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return 0;

  const { count, error } = await supabase
    .from('user_follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', session.user.id);

  if (error) return 0;
  return count ?? 0;
}
