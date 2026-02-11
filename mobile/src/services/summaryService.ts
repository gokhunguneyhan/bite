import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Summary } from '@/src/types/summary';
import { supabase } from '@/src/lib/supabase';
import { apiRequest, ApiError } from './api';

const LOCAL_STORAGE_KEY = '@bite_summaries';
const MIGRATION_FLAG = '@bite_migrated';

function mapRow(row: Record<string, unknown>): Summary {
  // Backward compat: old actionableInsights may be string[], normalize to {category, insight}[]
  const rawInsights = row.actionable_insights as unknown[];
  const actionableInsights = Array.isArray(rawInsights)
    ? rawInsights.map((item: any) =>
        typeof item === 'string'
          ? { category: 'strategy', insight: item }
          : { category: item.category || 'strategy', insight: item.insight || '' },
      )
    : [];

  // Backward compat: old affiliateLinks may lack author/category, type may be 'resource'
  const rawLinks = row.affiliate_links as unknown[];
  const affiliateLinks = Array.isArray(rawLinks)
    ? rawLinks.map((item: any) => ({
        title: item.title || '',
        author: item.author,
        url: item.url || '',
        type: item.type === 'resource' ? 'website' : (item.type || 'book'),
        category: item.category || 'by_speaker',
      }))
    : [];

  return {
    id: row.id as string,
    videoId: row.video_id as string,
    videoTitle: row.video_title as string,
    channelName: row.channel_name as string,
    thumbnailUrl: row.thumbnail_url as string,
    quickSummary: row.quick_summary as string,
    contextualSections: row.contextual_sections as Summary['contextualSections'],
    // Backward compat: old refresherCards may have frontText/backText instead of title/explanation
    refresherCards: Array.isArray(row.refresher_cards)
      ? (row.refresher_cards as any[]).map((c: any, i: number) => ({
          id: c.id || `rc${i + 1}`,
          title: c.title || c.frontText || '',
          explanation: c.explanation || c.backText || '',
          saved: c.saved ?? false,
        }))
      : [],
    actionableInsights,
    affiliateLinks,
    category: (row.category as string) || 'Other',
    createdAt: row.created_at as string,
    language: (row.language as string) || 'en',
    originalLanguage: (row.original_language as string) || (row.language as string) || 'en',
    isPublic: (row.is_public as boolean) ?? false,
    userId: row.user_id as string | undefined,
  };
}

export async function fetchSummaries(): Promise<Summary[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from('summaries')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function fetchSummary(id: string): Promise<Summary> {
  const { data, error } = await supabase
    .from('summaries')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) throw new Error('Summary not found');
  return mapRow(data);
}

export async function fetchCachedTranslation(
  summaryId: string,
  languageCode: string,
): Promise<Record<string, unknown> | null> {
  const { data } = await supabase
    .from('summary_translations')
    .select('translated_content')
    .eq('summary_id', summaryId)
    .eq('language_code', languageCode)
    .maybeSingle();

  return (data?.translated_content as Record<string, unknown>) ?? null;
}

export async function generateSummary(videoId: string): Promise<Summary> {
  const { data: { session } } = await supabase.auth.getSession();

  try {
    const summary = await apiRequest<Summary>('/api/summarize', {
      method: 'POST',
      body: { videoId },
      token: session?.access_token,
      timeoutMs: 600_000,
    });

    return summary;
  } catch (error) {
    if (error instanceof ApiError) {
      const statusMessages: Record<number, string> = {
        401: 'Please sign in again to continue.',
        404: 'This video is unavailable. It may be private, deleted, or region-restricted.',
        422: 'This video has no captions available. Try another video.',
        429: 'Too many requests. Please wait a moment and try again.',
      };
      throw new Error(
        statusMessages[error.status] ?? `Server error: ${error.message}`,
      );
    }
    throw new Error(
      'Could not connect to server. Make sure the backend is running.',
    );
  }
}

export async function translateSummary(summaryId: string, targetLanguage: string): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();

  return apiRequest('/api/translate', {
    method: 'POST',
    body: { summaryId, targetLanguage },
    token: session?.access_token,
  });
}

export async function fetchCommunitySummaries(): Promise<Summary[]> {
  const { data, error } = await supabase
    .from('summaries')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function togglePublish(id: string, isPublic: boolean): Promise<void> {
  const { error } = await supabase
    .from('summaries')
    .update({ is_public: isPublic })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function deleteSummary(id: string): Promise<void> {
  const { error } = await supabase
    .from('summaries')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function fetchSummariesByChannel(channelName: string): Promise<Summary[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from('summaries')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('channel_name', channelName)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function migrateLocalSummaries(userId: string): Promise<number> {
  const alreadyMigrated = await AsyncStorage.getItem(MIGRATION_FLAG);
  if (alreadyMigrated) return 0;

  const raw = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) {
    await AsyncStorage.setItem(MIGRATION_FLAG, 'true');
    return 0;
  }

  const localSummaries: Summary[] = JSON.parse(raw);
  if (localSummaries.length === 0) {
    await AsyncStorage.setItem(MIGRATION_FLAG, 'true');
    return 0;
  }

  const rows = localSummaries.map((s) => ({
    user_id: userId,
    video_id: s.videoId,
    video_title: s.videoTitle,
    channel_name: s.channelName,
    thumbnail_url: s.thumbnailUrl,
    quick_summary: s.quickSummary,
    contextual_sections: s.contextualSections,
    refresher_cards: s.refresherCards,
    actionable_insights: s.actionableInsights,
    affiliate_links: s.affiliateLinks,
    category: s.category || 'Other',
    language: s.language || 'en',
    original_language: s.originalLanguage || s.language || 'en',
    created_at: s.createdAt,
  }));

  const { error } = await supabase.from('summaries').insert(rows);

  if (!error) {
    await AsyncStorage.removeItem(LOCAL_STORAGE_KEY);
    await AsyncStorage.setItem(MIGRATION_FLAG, 'true');
  }

  return localSummaries.length;
}
