import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { transcribeWithWhisper, type WhisperResult } from './whisper.js';

const execFileAsync = promisify(execFile);

interface VideoMetadata {
  title: string;
  channelName: string;
  thumbnailUrl: string;
}

interface TranscriptResult {
  text: string;
  languageCode: string;
  durationSeconds: number;
}

export async function fetchVideoMetadata(
  videoId: string,
): Promise<VideoMetadata> {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch video metadata: ${response.status}`);
  }

  const data = await response.json();

  return {
    title: data.title,
    channelName: data.author_name,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  };
}

export async function fetchTranscript(videoId: string): Promise<TranscriptResult> {
  // Validate videoId format to prevent injection
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    throw new Error('Invalid video ID format');
  }

  try {
    const { stdout } = await execFileAsync('python3', [
      '-c',
      `
import json, sys
video_id = sys.argv[1]
try:
    from youtube_transcript_api import YouTubeTranscriptApi
    ytt_api = YouTubeTranscriptApi()
    transcript = ytt_api.fetch(video_id)
    parts = []
    next_marker = 0
    for entry in transcript.snippets:
        if entry.start >= next_marker:
            total_secs = int(entry.start)
            h, rem = divmod(total_secs, 3600)
            m, s = divmod(rem, 60)
            stamp = f'{h}:{m:02d}:{s:02d}' if h > 0 else f'{m}:{s:02d}'
            parts.append(f'[{stamp}]')
            next_marker = entry.start + 30
        parts.append(entry.text)
    text = ' '.join(parts)
    duration = int(transcript.snippets[-1].start + transcript.snippets[-1].duration) if transcript.snippets else 0
    print(json.dumps({"ok": True, "text": text, "languageCode": transcript.language_code, "durationSeconds": duration}))
except Exception as e:
    print(json.dumps({"ok": False, "error": str(e)}))
`,
      videoId,
    ], { timeout: 30_000 });

    const result = JSON.parse(stdout.trim());

    if (!result.ok) {
      throw new Error(result.error);
    }

    if (!result.text || result.text.length === 0) {
      throw new Error('No transcript available: empty transcript returned');
    }

    return {
      text: result.text,
      languageCode: result.languageCode || 'en',
      durationSeconds: result.durationSeconds || 0,
    };
  } catch (error: any) {
    const msg = error.message ?? '';

    // Already tagged — rethrow as-is
    if (msg.startsWith('[NO_CAPTIONS]') || msg.startsWith('[VIDEO_UNAVAILABLE]') || msg.startsWith('[RATE_LIMITED]')) {
      throw error;
    }

    const lower = msg.toLowerCase();

    if (lower.includes('no transcript') || lower.includes('subtitles are disabled') || lower.includes('transcript is disabled')) {
      throw new Error(`[NO_CAPTIONS] ${msg}`);
    }

    if (lower.includes('video unavailable') || lower.includes('video is unavailable') || lower.includes('private video') || lower.includes('video is private')) {
      throw new Error(`[VIDEO_UNAVAILABLE] ${msg}`);
    }

    if (lower.includes('too many requests') || lower.includes('rate limit')) {
      throw new Error(`[RATE_LIMITED] ${msg}`);
    }

    throw new Error(`[NO_CAPTIONS] No transcript available: ${msg || 'unknown error'}`);
  }
}

/**
 * Task 2: Get transcript with smart fallback
 *
 * Strategy:
 * 1. Try YouTube API first (instant, free, works for 80% of videos)
 * 2. Fall back to Whisper if no captions (slower but handles all videos)
 *
 * @param videoId YouTube video ID
 * @returns Transcript with timestamps
 */
export async function getTranscriptWithFallback(videoId: string): Promise<TranscriptResult> {
  try {
    // Try YouTube API first (instant, free)
    console.log(`[transcript] Attempting YouTube captions for ${videoId}`);
    return await fetchTranscript(videoId);
  } catch (error: any) {
    const msg = error.message || '';

    // If no captions, fall back to Whisper
    if (msg.includes('[NO_CAPTIONS]')) {
      console.log(`[transcript] No YT captions, falling back to Whisper for ${videoId}`);
      return await transcribeWithWhisper(videoId);
    }

    // Other errors (rate limit, video unavailable) should bubble up
    throw error;
  }
}
