import { supabase } from '../lib/supabase';
import { fetchSummary } from './summaryService';
import type { Summary } from '../types/summary';

export interface Collection {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  slug: string;
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
  itemCount: number;
  /** First item's thumbnail, used as fallback cover */
  firstThumbnail: string | null;
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  summaryId: string | null;
  videoId: string | null;
  videoTitle: string;
  channelName: string;
  thumbnailUrl: string;
  position: number;
  /** Populated when summaryId exists and summary was fetched */
  summary?: Summary;
}

export async function fetchCollections(): Promise<Collection[]> {
  const { data, error } = await supabase
    .from('collections')
    .select('*, collection_items(id, thumbnail_url)')
    .eq('is_published', true)
    .order('display_order', { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    slug: row.slug,
    isPublished: row.is_published,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    itemCount: row.collection_items?.length ?? 0,
    firstThumbnail: row.collection_items?.[0]?.thumbnail_url ?? null,
  }));
}

export async function fetchCollectionWithItems(
  id: string,
): Promise<{ collection: Collection; items: CollectionItem[] }> {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) throw new Error('Collection not found');

  const { data: itemRows, error: itemsErr } = await supabase
    .from('collection_items')
    .select('*')
    .eq('collection_id', id)
    .order('position', { ascending: true });

  if (itemsErr) throw new Error(itemsErr.message);

  const items: CollectionItem[] = (itemRows ?? []).map((row: any) => ({
    id: row.id,
    collectionId: row.collection_id,
    summaryId: row.summary_id,
    videoId: row.video_id,
    videoTitle: row.video_title,
    channelName: row.channel_name,
    thumbnailUrl: row.thumbnail_url,
    position: row.position,
  }));

  // Fetch full summaries for items that have a summary_id
  const summaryIds = items
    .filter((i) => i.summaryId)
    .map((i) => i.summaryId!);

  if (summaryIds.length > 0) {
    const summaries = await Promise.all(
      summaryIds.map((sid) => fetchSummary(sid).catch(() => null)),
    );
    const summaryMap = new Map<string, Summary>();
    for (const s of summaries) {
      if (s) summaryMap.set(s.id, s);
    }
    for (const item of items) {
      if (item.summaryId && summaryMap.has(item.summaryId)) {
        item.summary = summaryMap.get(item.summaryId);
      }
    }
  }

  const collection: Collection = {
    id: data.id,
    title: data.title,
    description: data.description,
    coverImageUrl: data.cover_image_url,
    slug: data.slug,
    isPublished: data.is_published,
    displayOrder: data.display_order,
    createdAt: data.created_at,
    itemCount: items.length,
    firstThumbnail: items[0]?.thumbnailUrl ?? null,
  };

  return { collection, items };
}
