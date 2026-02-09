import { subscribeToCreator } from '@/src/services/creatorService';
import {
  MOCK_YOUTUBE_SUBSCRIPTIONS,
  MOCK_CHANNEL_VIDEOS,
  type YouTubeSubscription,
  type YouTubeVideo,
} from '@/src/mocks/youtubeSubscriptions';

/**
 * Import YouTube subscriptions.
 *
 * TODO: Replace mock with real Google Sign-In flow:
 * 1. Use expo-auth-session or @react-native-google-signin/google-signin
 * 2. Request scope: https://www.googleapis.com/auth/youtube.readonly
 * 3. Fetch subscriptions from YouTube Data API v3
 * 4. Import channels into creator_subscriptions table
 */
export async function importYouTubeSubscriptions(): Promise<YouTubeSubscription[]> {
  // Mock: simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Subscribe to each mock channel
  const results: YouTubeSubscription[] = [];
  for (const sub of MOCK_YOUTUBE_SUBSCRIPTIONS) {
    try {
      await subscribeToCreator(sub.channelName);
      results.push(sub);
    } catch {
      // Already subscribed — that's fine, still include in results
      results.push(sub);
    }
  }

  return results;
}

/**
 * Fetch latest videos for a channel.
 *
 * TODO: Replace with YouTube Data API v3:
 * GET https://www.googleapis.com/youtube/v3/search
 *   ?part=snippet&channelId={id}&order=date&type=video&maxResults=10
 */
export function getChannelLatestVideos(channelName: string): YouTubeVideo[] {
  return MOCK_CHANNEL_VIDEOS[channelName] ?? [];
}
