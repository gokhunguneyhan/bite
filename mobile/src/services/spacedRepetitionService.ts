import { supabase } from '@/src/lib/supabase';

export interface CardReview {
  id: string;
  userId: string;
  summaryId: string;
  cardId: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: string;
  lastReviewedAt: string | null;
  createdAt: string;
}

export interface DueCard {
  reviewId: string;
  summaryId: string;
  cardId: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: string;
  // Card content from summary
  title: string;
  explanation: string;
  // Video info from summary
  videoTitle: string;
  thumbnailUrl: string;
}

function mapReviewRow(row: Record<string, unknown>): CardReview {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    summaryId: row.summary_id as string,
    cardId: row.card_id as string,
    easeFactor: row.ease_factor as number,
    intervalDays: row.interval_days as number,
    repetitions: row.repetitions as number,
    nextReviewAt: row.next_review_at as string,
    lastReviewedAt: row.last_reviewed_at as string | null,
    createdAt: row.created_at as string,
  };
}

/**
 * Fetch all cards that are due for review (next_review_at <= now).
 * Joins with summaries to enrich with card content and video info.
 */
export async function fetchDueCards(): Promise<DueCard[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const now = new Date().toISOString();

  const { data: reviews, error } = await supabase
    .from('card_reviews')
    .select('*, summaries(video_title, thumbnail_url, refresher_cards)')
    .eq('user_id', session.user.id)
    .lte('next_review_at', now)
    .order('next_review_at', { ascending: true });

  if (error) return [];

  const dueCards: DueCard[] = [];

  for (const row of reviews ?? []) {
    const summary = row.summaries as Record<string, unknown> | null;
    if (!summary) continue;

    const refresherCards = summary.refresher_cards as any[] | null;
    if (!Array.isArray(refresherCards)) continue;

    const card = refresherCards.find(
      (c: any) => (c.id || '') === row.card_id,
    );
    if (!card) continue;

    dueCards.push({
      reviewId: row.id,
      summaryId: row.summary_id,
      cardId: row.card_id,
      easeFactor: row.ease_factor,
      intervalDays: row.interval_days,
      repetitions: row.repetitions,
      nextReviewAt: row.next_review_at,
      title: card.title || card.frontText || '',
      explanation: card.explanation || card.backText || '',
      videoTitle: summary.video_title as string,
      thumbnailUrl: summary.thumbnail_url as string,
    });
  }

  return dueCards;
}

/**
 * Fetch all scheduled cards for the current user (for stats).
 */
export async function fetchAllScheduledCards(): Promise<CardReview[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from('card_reviews')
    .select('*')
    .eq('user_id', session.user.id)
    .order('next_review_at', { ascending: true });

  if (error) return [];
  return (data ?? []).map(mapReviewRow);
}

/**
 * Schedule a card for spaced repetition review.
 */
export async function scheduleCard(
  summaryId: string,
  cardId: string,
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { error } = await supabase.from('card_reviews').insert({
    user_id: session.user.id,
    summary_id: summaryId,
    card_id: cardId,
  });

  if (error) throw new Error(error.message);
}

/**
 * Remove a card from the spaced repetition schedule.
 */
export async function unscheduleCard(
  summaryId: string,
  cardId: string,
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('card_reviews')
    .delete()
    .eq('user_id', session.user.id)
    .eq('summary_id', summaryId)
    .eq('card_id', cardId);

  if (error) throw new Error(error.message);
}

/**
 * Check if a specific card is scheduled for review.
 */
export async function isCardScheduled(
  summaryId: string,
  cardId: string,
): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  const { data, error } = await supabase
    .from('card_reviews')
    .select('id')
    .eq('user_id', session.user.id)
    .eq('summary_id', summaryId)
    .eq('card_id', cardId)
    .maybeSingle();

  if (error) return false;
  return data !== null;
}

/**
 * SM-2 spaced repetition algorithm.
 * @param quality 0-5 rating (0-2 = fail, 3-5 = pass)
 */
export async function reviewCard(
  summaryId: string,
  cardId: string,
  quality: 0 | 1 | 2 | 3 | 4 | 5,
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  // Fetch current review state
  const { data: current, error: fetchError } = await supabase
    .from('card_reviews')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('summary_id', summaryId)
    .eq('card_id', cardId)
    .single();

  if (fetchError || !current) throw new Error('Card review not found');

  let easeFactor = current.ease_factor as number;
  let intervalDays: number;
  let repetitions = current.repetitions as number;

  if (quality < 3) {
    // Failed review: reset
    repetitions = 0;
    intervalDays = 1;
  } else {
    // Successful review
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round((current.interval_days as number) * easeFactor);
    }
    repetitions += 1;
  }

  // Update ease factor (applies regardless of pass/fail)
  easeFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const now = new Date();
  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + intervalDays);

  const { error: updateError } = await supabase
    .from('card_reviews')
    .update({
      ease_factor: easeFactor,
      interval_days: intervalDays,
      repetitions,
      next_review_at: nextReview.toISOString(),
      last_reviewed_at: now.toISOString(),
    })
    .eq('user_id', session.user.id)
    .eq('summary_id', summaryId)
    .eq('card_id', cardId);

  if (updateError) throw new Error(updateError.message);
}
