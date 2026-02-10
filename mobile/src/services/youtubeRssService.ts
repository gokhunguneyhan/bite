import type { YouTubeVideo } from '../mocks/youtubeSubscriptions';
import { FEATURED_CREATORS } from '../constants/featuredCreators';

// ---------------------------------------------------------------------------
// In-memory cache (channelId -> { videos, fetchedAt })
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CacheEntry {
  videos: YouTubeVideo[];
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseEntries(xml: string, channelName: string): YouTubeVideo[] {
  const videos: YouTubeVideo[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;

  let match: RegExpExecArray | null;
  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1];

    const videoIdMatch = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const titleMatch = block.match(/<title>([^<]+)<\/title>/);
    const publishedMatch = block.match(/<published>([^<]+)<\/published>/);

    if (!videoIdMatch || !titleMatch || !publishedMatch) continue;

    const videoId = videoIdMatch[1].trim();

    videos.push({
      videoId,
      title: decodeHtmlEntities(titleMatch[1].trim()),
      channelName,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      publishedAt: publishedMatch[1].trim(),
      durationLabel: '',
    });
  }

  return videos;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch the latest videos from a YouTube channel via its public Atom RSS feed.
 * Returns at most 5 videos sorted newest-first.
 * On any error the function returns an empty array silently.
 */
export async function fetchChannelRssVideos(
  channelId: string,
  channelName: string,
): Promise<YouTubeVideo[]> {
  try {
    // Check cache
    const cached = cache.get(channelId);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return cached.videos;
    }

    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const response = await fetch(url);

    if (!response.ok) return [];

    const xml = await response.text();
    const videos = parseEntries(xml, channelName)
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() -
          new Date(a.publishedAt).getTime(),
      )
      .slice(0, 5);

    cache.set(channelId, { videos, fetchedAt: Date.now() });

    return videos;
  } catch {
    return [];
  }
}

/**
 * Fetch latest videos for a content category by aggregating RSS feeds from
 * all FEATURED_CREATORS whose category matches (case-insensitive).
 * Returns at most 10 videos sorted newest-first, deduplicated by videoId.
 */
export async function fetchCategoryVideos(
  category: string,
): Promise<YouTubeVideo[]> {
  const lowerCategory = category.toLowerCase();

  const matchingCreators = FEATURED_CREATORS.filter(
    (c) =>
      c.category.toLowerCase().includes(lowerCategory) ||
      lowerCategory.includes(c.category.toLowerCase()),
  );

  const results = await Promise.allSettled(
    matchingCreators.map((c) => fetchChannelRssVideos(c.channelId, c.name)),
  );

  const allVideos: YouTubeVideo[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    for (const video of result.value) {
      if (!seen.has(video.videoId)) {
        seen.add(video.videoId);
        allVideos.push(video);
      }
    }
  }

  return allVideos
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() -
        new Date(a.publishedAt).getTime(),
    )
    .slice(0, 10);
}
