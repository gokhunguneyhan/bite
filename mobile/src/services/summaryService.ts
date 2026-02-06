import type { Summary } from '@/src/types/summary';
import { apiRequest, ApiError } from './api';

// In-memory cache of summaries for the session
let cachedSummaries: Summary[] = [];

export async function fetchSummaries(): Promise<Summary[]> {
  // TODO: Replace with API call when user accounts exist
  return cachedSummaries;
}

export async function fetchSummary(id: string): Promise<Summary> {
  const cached = cachedSummaries.find((s) => s.id === id);
  if (cached) return cached;
  throw new Error('Summary not found');
}

export async function generateSummary(videoId: string): Promise<Summary> {
  try {
    const summary = await apiRequest<Summary>('/api/summarize', {
      method: 'POST',
      body: { videoId },
    });

    // Cache the result
    cachedSummaries = [summary, ...cachedSummaries];
    return summary;
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(
        error.status === 422
          ? 'This video has no captions available. Try another video.'
          : `Server error: ${error.message}`,
      );
    }
    throw new Error(
      'Could not connect to server. Make sure the backend is running.',
    );
  }
}
