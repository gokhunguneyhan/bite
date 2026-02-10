import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { YouTubeVideo } from '../mocks/youtubeSubscriptions';

interface YouTubeStore {
  /** channelName → latest videos (cached from YouTube API) */
  channelVideos: Record<string, YouTubeVideo[]>;
  /** channelName → channelId mapping (for API calls) */
  channelIds: Record<string, string>;
  setChannelVideos: (channelName: string, videos: YouTubeVideo[]) => void;
  setChannelId: (channelName: string, channelId: string) => void;
  bulkSetChannelIds: (mapping: Record<string, string>) => void;
  clear: () => void;
}

export const useYouTubeStore = create<YouTubeStore>()(
  persist(
    (set) => ({
      channelVideos: {},
      channelIds: {},
      setChannelVideos: (channelName, videos) =>
        set((state) => ({
          channelVideos: { ...state.channelVideos, [channelName]: videos },
        })),
      setChannelId: (channelName, channelId) =>
        set((state) => ({
          channelIds: { ...state.channelIds, [channelName]: channelId },
        })),
      bulkSetChannelIds: (mapping) =>
        set((state) => ({
          channelIds: { ...state.channelIds, ...mapping },
        })),
      clear: () => set({ channelVideos: {}, channelIds: {} }),
    }),
    {
      name: 'youtube-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
