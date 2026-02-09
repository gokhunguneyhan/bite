import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

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
    if (error.message?.includes('No transcript')) {
      throw error;
    }
    throw new Error(
      `No transcript available: ${error.message ?? 'unknown error'}`,
    );
  }
}
