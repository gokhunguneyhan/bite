import { getGoogleAccessToken, googleSignIn } from './googleAuthService';
import type { YouTubeSubscription, YouTubeVideo } from '../mocks/youtubeSubscriptions';

const YT_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Get a valid Google access token, prompting sign-in if needed.
 */
async function ensureAccessToken(): Promise<string> {
  let token = await getGoogleAccessToken();
  if (!token) {
    const result = await googleSignIn();
    token = result.accessToken;
  }
  return token;
}

/**
 * Fetch the authenticated user's YouTube subscriptions.
 * Paginates through all results (max ~200 to stay within quota).
 */
export async function fetchYouTubeSubscriptions(): Promise<YouTubeSubscription[]> {
  const accessToken = await ensureAccessToken();

  const subs: YouTubeSubscription[] = [];
  let pageToken: string | undefined;
  let pages = 0;

  do {
    const url = new URL(`${YT_API_BASE}/subscriptions`);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('mine', 'true');
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('order', 'relevance');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`YouTube API error ${res.status}: ${body}`);
    }

    const data = await res.json();

    for (const item of data.items ?? []) {
      subs.push({
        channelId: item.snippet.resourceId.channelId,
        channelName: item.snippet.title,
        thumbnailUrl:
          item.snippet.thumbnails?.medium?.url ??
          item.snippet.thumbnails?.default?.url ??
          '',
        subscriberCount: '',
      });
    }

    pageToken = data.nextPageToken;
    pages++;
  } while (pageToken && pages < 4); // Cap at 200 channels

  return subs;
}

/**
 * Fetch latest videos from a YouTube channel.
 */
export async function fetchChannelLatestVideos(
  channelId: string,
  maxResults = 5,
): Promise<YouTubeVideo[]> {
  const accessToken = await getGoogleAccessToken();
  if (!accessToken) return [];

  const url = new URL(`${YT_API_BASE}/search`);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('channelId', channelId);
  url.searchParams.set('order', 'date');
  url.searchParams.set('type', 'video');
  url.searchParams.set('maxResults', String(maxResults));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return [];

  const data = await res.json();

  const videos: YouTubeVideo[] = (data.items ?? []).map(
    (item: Record<string, unknown>) => {
      const snippet = item.snippet as Record<string, unknown>;
      const id = item.id as Record<string, unknown>;
      const thumbs = snippet.thumbnails as Record<string, Record<string, string>> | undefined;
      return {
        videoId: id.videoId as string,
        title: snippet.title as string,
        channelName: snippet.channelTitle as string,
        thumbnailUrl: thumbs?.high?.url ?? thumbs?.medium?.url ?? '',
        publishedAt: snippet.publishedAt as string,
        durationLabel: '',
      };
    },
  );

  return videos;
}
