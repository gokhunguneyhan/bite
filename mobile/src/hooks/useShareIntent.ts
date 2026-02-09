import { useEffect, useCallback, useRef } from 'react';
import { useShareIntentContext } from 'expo-share-intent';
import { extractVideoId } from '@/src/services/youtube';

/**
 * Extracts a YouTube URL from share intent data.
 *
 * When the user shares from Safari or the YouTube app, the share intent
 * may contain the URL in `shareIntent.webUrl` (for web-url type shares)
 * or embedded within `shareIntent.text` (for plain-text shares).
 *
 * This function checks both fields and returns the first valid YouTube URL
 * found, or null if no YouTube URL is present.
 */
function extractYouTubeUrlFromShareIntent(shareIntent: {
  text?: string | null;
  webUrl?: string | null;
}): string | null {
  // First try webUrl -- this is populated for web-url type shares
  if (shareIntent.webUrl) {
    const videoId = extractVideoId(shareIntent.webUrl);
    if (videoId) return shareIntent.webUrl;
  }

  // Fall back to text -- some apps share URLs as plain text,
  // sometimes with extra text around the URL
  if (shareIntent.text) {
    // Try the raw text first (it might be just the URL)
    const videoId = extractVideoId(shareIntent.text);
    if (videoId) return shareIntent.text.trim();

    // Try to find a YouTube URL within longer text
    const urlPattern =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}[^\s]*/;
    const match = shareIntent.text.match(urlPattern);
    if (match) {
      const extracted = match[0];
      const id = extractVideoId(extracted);
      if (id) return extracted;
    }
  }

  return null;
}

/**
 * Hook that listens for incoming share intents and invokes the callback
 * with the YouTube URL when one is detected.
 *
 * Usage:
 * ```ts
 * useShareIntentUrl((url) => setUrl(url));
 * ```
 */
export function useShareIntentUrl(onYouTubeUrl: (url: string) => void) {
  const { hasShareIntent, shareIntent, resetShareIntent } =
    useShareIntentContext();
  const onUrlRef = useRef(onYouTubeUrl);
  onUrlRef.current = onYouTubeUrl;

  useEffect(() => {
    if (!hasShareIntent) return;

    const youtubeUrl = extractYouTubeUrlFromShareIntent(shareIntent);
    if (youtubeUrl) {
      onUrlRef.current(youtubeUrl);
    }
    // Reset so re-sharing works without leaving and returning
    resetShareIntent();
  }, [hasShareIntent, shareIntent, resetShareIntent]);
}
