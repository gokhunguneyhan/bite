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
    }),
    {
      name: '@yt_summarise_user_follows',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
