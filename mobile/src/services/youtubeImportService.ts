import { subscribeToCreator } from '@/src/services/creatorService';
import { fetchYouTubeSubscriptions, fetchChannelLatestVideos } from '@/src/services/youtubeApiService';
import { useYouTubeStore } from '@/src/stores/youtubeStore';
import {
  MOCK_YOUTUBE_SUBSCRIPTIONS,
  MOCK_CHANNEL_VIDEOS,
  type YouTubeSubscription,
  type YouTubeVideo,
} from '@/src/mocks/youtubeSubscriptions';

/**
 * Import YouTube subscriptions.
 * Tries real Google Sign-In + YouTube Data API first.
 * Falls back to mock data if Google Sign-In fails or isn't configured.
 */
export async function importYouTubeSubscriptions(): Promise<YouTubeSubscription[]> {
  let subs: YouTubeSubscription[];

  try {
    subs = await fetchYouTubeSubscriptions();
  } catch {
    // Fallback to mock data if Google Sign-In not configured or cancelled
    await new Promise((resolve) => setTimeout(resolve, 800));
    subs = MOCK_YOUTUBE_SUBSCRIPTIONS;
  }

  // Store channelName → channelId mapping for later API calls
  const mapping: Record<string, string> = {};
  for (const sub of subs) {
    mapping[sub.channelName] = sub.channelId;
  }
  useYouTubeStore.getState().bulkSetChannelIds(mapping);

  // Subscribe to each channel in Supabase
  const results: YouTubeSubscription[] = [];
  for (const sub of subs) {
    try {
      await subscribeToCreator(sub.channelName);
      results.push(sub);
    } catch {
      // Already subscribed — still include
      results.push(sub);
    }
  }

  // Fetch latest videos for top channels (background, don't block)
  fetchLatestVideosForChannels(results.slice(0, 10));

  return results;
}

/**
 * Fetch and cache latest videos for multiple channels.
 */
async function fetchLatestVideosForChannels(subs: YouTubeSubscription[]) {
  const store = useYouTubeStore.getState();

  for (const sub of subs) {
    try {
      const videos = await fetchChannelLatestVideos(sub.channelId, 3);
      if (videos.length > 0) {
        store.setChannelVideos(sub.channelName, videos);
      }
    } catch {
      // Use mock data as fallback for this channel
      const mockVideos = MOCK_CHANNEL_VIDEOS[sub.channelName];
      if (mockVideos) {
        store.setChannelVideos(sub.channelName, mockVideos);
      }
    }
  }
}

/**
 * Get latest videos for a channel.
 * Reads from YouTube store (cached), falls back to mock data.
 */
export function getChannelLatestVideos(channelName: string): YouTubeVideo[] {
  const cached = useYouTubeStore.getState().channelVideos[channelName];
  if (cached && cached.length > 0) return cached;
  return MOCK_CHANNEL_VIDEOS[channelName] ?? [];
}
