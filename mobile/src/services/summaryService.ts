import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Summary } from '@/src/types/summary';
import { apiRequest, ApiError } from './api';

const STORAGE_KEY = '@yt_summarise_summaries';

async function loadSummaries(): Promise<Summary[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveSummaries(summaries: Summary[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(summaries));
}

export async function fetchSummaries(): Promise<Summary[]> {
  return loadSummaries();
}

export async function fetchSummary(id: string): Promise<Summary> {
  const summaries = await loadSummaries();
  const found = summaries.find((s) => s.id === id);
  if (found) return found;
  throw new Error('Summary not found');
}

export async function generateSummary(videoId: string, language: string = 'en'): Promise<Summary> {
  try {
    const summary = await apiRequest<Summary>('/api/summarize', {
      method: 'POST',
      body: { videoId, language },
    });

    const existing = await loadSummaries();
    await saveSummaries([summary, ...existing]);
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

export async function deleteSummary(id: string): Promise<void> {
  const summaries = await loadSummaries();
  await saveSummaries(summaries.filter((s) => s.id !== id));
}

export async function fetchSummariesByChannel(channelName: string): Promise<Summary[]> {
  const summaries = await loadSummaries();
  return summaries.filter((s) => s.channelName === channelName);
}
