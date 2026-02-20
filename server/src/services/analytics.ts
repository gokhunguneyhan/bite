import { supabase } from '../lib/supabase.js';

// ── Cost rates (USD per token) ──
// Claude Sonnet 4.5: $3/M input, $15/M output
const INPUT_COST_PER_TOKEN = 3 / 1_000_000;
const OUTPUT_COST_PER_TOKEN = 15 / 1_000_000;
// Cached tokens are 90% cheaper
const CACHE_READ_COST_PER_TOKEN = INPUT_COST_PER_TOKEN * 0.1;

export function computeCost(usage: {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
}): number {
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const cacheCreation = usage.cache_creation_input_tokens ?? 0;
  const regularInput = usage.input_tokens - cacheRead - cacheCreation;

  return (
    regularInput * INPUT_COST_PER_TOKEN +
    cacheCreation * INPUT_COST_PER_TOKEN +
    cacheRead * CACHE_READ_COST_PER_TOKEN +
    usage.output_tokens * OUTPUT_COST_PER_TOKEN
  );
}

export function classifyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('[video_unavailable]') || lower.includes('video is unavailable'))
    return 'video_unavailable';
  if (lower.includes('[no_captions]') || lower.includes('transcript'))
    return 'no_captions';
  if (lower.includes('[rate_limited]') || lower.includes('rate limit'))
    return 'rate_limited';
  if (lower.includes('timeout') || lower.includes('etimedout') || lower.includes('econnreset'))
    return 'network_timeout';
  if (lower.includes('content policy') || lower.includes('content_policy'))
    return 'content_policy';
  if (lower.includes('token') && (lower.includes('limit') || lower.includes('exceed')))
    return 'token_limit_exceeded';
  if (lower.includes('parse') || lower.includes('json'))
    return 'parse_error';
  if (lower.includes('unsupported language'))
    return 'unsupported_language';
  return 'unknown';
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export interface AnalyticsRecord {
  summary_id?: string;
  video_id: string;
  user_id: string;
  video_duration_seconds?: number;
  video_language?: string;
  source_platform?: string;
  processing_time_ms?: number;
  token_usage_input?: number;
  token_usage_output?: number;
  token_usage_total?: number;
  token_cache_read?: number;
  token_cache_creation?: number;
  estimated_cost_usd?: number;
  output_word_count?: number;
  status: 'success' | 'failed';
  error_type?: string;
  error_message?: string;
  retry_count?: number;
  was_cache_hit?: boolean;
}

export async function recordAnalytics(record: AnalyticsRecord): Promise<void> {
  if (!supabase) return;

  try {
    const { error } = await supabase.from('summary_analytics').insert(record);
    if (error) {
      console.error('[analytics] Failed to record:', error.message);
    }
  } catch (err) {
    console.error('[analytics] Exception recording analytics:', err);
  }
}

// ── Query helpers for admin API ──

export async function getOverview(from?: string, to?: string) {
  if (!supabase) throw new Error('DB not configured');

  let query = supabase.from('summary_analytics').select('*');
  if (from) query = query.gte('created_at', from);
  if (to) query = query.lte('created_at', to);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const success = rows.filter((r) => r.status === 'success');
  const failed = rows.filter((r) => r.status === 'failed');
  const totalCost = success.reduce((s, r) => s + (r.estimated_cost_usd ?? 0), 0);
  const avgProcessing =
    success.length > 0
      ? success.reduce((s, r) => s + (r.processing_time_ms ?? 0), 0) / success.length
      : 0;
  const uniqueUsers = new Set(rows.map((r) => r.user_id)).size;

  return {
    totalSummaries: rows.length,
    successCount: success.length,
    failureCount: failed.length,
    successRate: rows.length > 0 ? Math.round((success.length / rows.length) * 1000) / 10 : 0,
    totalCost: Math.round(totalCost * 100) / 100,
    avgProcessingMs: Math.round(avgProcessing),
    activeUsers: uniqueUsers,
  };
}

export async function getCategoryStats(from?: string, to?: string) {
  if (!supabase) throw new Error('DB not configured');

  // Use the view for pre-computed stats, but for date filtering we query raw
  let query = supabase
    .from('summary_analytics')
    .select('summary_id, estimated_cost_usd, video_duration_seconds')
    .eq('status', 'success')
    .not('summary_id', 'is', null);
  if (from) query = query.gte('created_at', from);
  if (to) query = query.lte('created_at', to);

  const { data: analytics } = await query;

  // Get categories from summaries
  const summaryIds = [...new Set((analytics ?? []).map((a) => a.summary_id).filter(Boolean))];
  if (summaryIds.length === 0) return [];

  const { data: summaries } = await supabase
    .from('summaries')
    .select('id, category')
    .in('id', summaryIds);

  const catMap = new Map((summaries ?? []).map((s) => [s.id, s.category || 'Other']));

  // Group by category
  const grouped: Record<string, { count: number; totalCost: number; totalDuration: number }> = {};
  for (const a of analytics ?? []) {
    const cat = catMap.get(a.summary_id) ?? 'Other';
    if (!grouped[cat]) grouped[cat] = { count: 0, totalCost: 0, totalDuration: 0 };
    grouped[cat].count++;
    grouped[cat].totalCost += a.estimated_cost_usd ?? 0;
    grouped[cat].totalDuration += a.video_duration_seconds ?? 0;
  }

  const total = Object.values(grouped).reduce((s, g) => s + g.count, 0);

  return Object.entries(grouped)
    .map(([category, g]) => ({
      category,
      count: g.count,
      percentage: total > 0 ? Math.round((g.count / total) * 1000) / 10 : 0,
      avgDurationSeconds: g.count > 0 ? Math.round(g.totalDuration / g.count) : 0,
      avgCost: g.count > 0 ? Math.round((g.totalCost / g.count) * 10000) / 10000 : 0,
      totalCost: Math.round(g.totalCost * 10000) / 10000,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getPerformanceStats(from?: string, to?: string) {
  if (!supabase) throw new Error('DB not configured');

  let query = supabase
    .from('summary_analytics')
    .select('processing_time_ms, retry_count, created_at, status')
    .eq('status', 'success')
    .not('processing_time_ms', 'is', null);
  if (from) query = query.gte('created_at', from);
  if (to) query = query.lte('created_at', to);

  const { data } = await query;
  const rows = data ?? [];

  if (rows.length === 0) {
    return { p50: 0, p90: 0, p99: 0, avgRetry: 0, total: 0, volumeDaily: [], volumeHourly: [], volumeDow: [] };
  }

  const times = rows.map((r) => r.processing_time_ms).sort((a, b) => a - b);
  const p50 = times[Math.floor(times.length * 0.5)];
  const p90 = times[Math.floor(times.length * 0.9)];
  const p99 = times[Math.floor(times.length * 0.99)];
  const avgRetry =
    Math.round((rows.reduce((s, r) => s + (r.retry_count ?? 0), 0) / rows.length) * 100) / 100;

  // Volume daily
  const dailyMap: Record<string, { success: number; failed: number }> = {};
  // Also fetch failed rows for volume chart
  let failQuery = supabase
    .from('summary_analytics')
    .select('created_at')
    .eq('status', 'failed');
  if (from) failQuery = failQuery.gte('created_at', from);
  if (to) failQuery = failQuery.lte('created_at', to);
  const { data: failedRows } = await failQuery;

  for (const r of rows) {
    const day = r.created_at.slice(0, 10);
    if (!dailyMap[day]) dailyMap[day] = { success: 0, failed: 0 };
    dailyMap[day].success++;
  }
  for (const r of failedRows ?? []) {
    const day = r.created_at.slice(0, 10);
    if (!dailyMap[day]) dailyMap[day] = { success: 0, failed: 0 };
    dailyMap[day].failed++;
  }
  const volumeDaily = Object.entries(dailyMap)
    .map(([day, v]) => ({ day, ...v, total: v.success + v.failed }))
    .sort((a, b) => a.day.localeCompare(b.day));

  // Volume by hour
  const hourMap: number[] = Array(24).fill(0);
  for (const r of rows) {
    const h = new Date(r.created_at).getUTCHours();
    hourMap[h]++;
  }
  const volumeHourly = hourMap.map((count, hour) => ({ hour, count }));

  // Volume by day of week
  const dowMap: number[] = Array(7).fill(0);
  const dowNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (const r of rows) {
    const dow = new Date(r.created_at).getUTCDay();
    dowMap[dow]++;
  }
  const volumeDow = dowMap.map((count, i) => ({ day: dowNames[i], count }));

  return { p50, p90, p99, avgRetry, total: rows.length, volumeDaily, volumeHourly, volumeDow };
}

export async function getCostStats(from?: string, to?: string) {
  if (!supabase) throw new Error('DB not configured');

  let query = supabase
    .from('summary_analytics')
    .select('video_duration_seconds, estimated_cost_usd, created_at')
    .eq('status', 'success');
  if (from) query = query.gte('created_at', from);
  if (to) query = query.lte('created_at', to);

  const { data } = await query;
  const rows = data ?? [];

  // By duration bucket
  const buckets: Record<string, { count: number; totalCost: number }> = {
    '0-5 min': { count: 0, totalCost: 0 },
    '5-15 min': { count: 0, totalCost: 0 },
    '15-30 min': { count: 0, totalCost: 0 },
    '30-60 min': { count: 0, totalCost: 0 },
    '60+ min': { count: 0, totalCost: 0 },
  };

  for (const r of rows) {
    const dur = r.video_duration_seconds ?? 0;
    let bucket: string;
    if (dur < 300) bucket = '0-5 min';
    else if (dur < 900) bucket = '5-15 min';
    else if (dur < 1800) bucket = '15-30 min';
    else if (dur < 3600) bucket = '30-60 min';
    else bucket = '60+ min';

    buckets[bucket].count++;
    buckets[bucket].totalCost += r.estimated_cost_usd ?? 0;
  }

  const byDuration = Object.entries(buckets).map(([bucket, v]) => ({
    bucket,
    count: v.count,
    avgCost: v.count > 0 ? Math.round((v.totalCost / v.count) * 10000) / 10000 : 0,
    totalCost: Math.round(v.totalCost * 100) / 100,
  }));

  // Daily cost trend
  const dailyCost: Record<string, number> = {};
  for (const r of rows) {
    const day = r.created_at.slice(0, 10);
    dailyCost[day] = (dailyCost[day] ?? 0) + (r.estimated_cost_usd ?? 0);
  }
  const costTrend = Object.entries(dailyCost)
    .map(([day, cost]) => ({ day, cost: Math.round(cost * 100) / 100 }))
    .sort((a, b) => a.day.localeCompare(b.day));

  const totalCost = rows.reduce((s, r) => s + (r.estimated_cost_usd ?? 0), 0);
  const avgCost = rows.length > 0 ? totalCost / rows.length : 0;

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    avgCost: Math.round(avgCost * 10000) / 10000,
    totalSummaries: rows.length,
    byDuration,
    costTrend,
  };
}

export async function getUserCohorts(from?: string, to?: string) {
  if (!supabase) throw new Error('DB not configured');

  let query = supabase
    .from('summary_analytics')
    .select('user_id, created_at')
    .eq('status', 'success');
  if (from) query = query.gte('created_at', from);
  if (to) query = query.lte('created_at', to);

  const { data } = await query;
  const rows = data ?? [];

  // Per-user: first summary date, total count
  const userMap: Record<string, { first: string; count: number }> = {};
  for (const r of rows) {
    if (!userMap[r.user_id]) {
      userMap[r.user_id] = { first: r.created_at, count: 0 };
    }
    userMap[r.user_id].count++;
    if (r.created_at < userMap[r.user_id].first) {
      userMap[r.user_id].first = r.created_at;
    }
  }

  // Histogram buckets
  const histBuckets: Record<string, number> = { '1': 0, '2-5': 0, '6-10': 0, '11-25': 0, '26+': 0 };
  for (const u of Object.values(userMap)) {
    if (u.count === 1) histBuckets['1']++;
    else if (u.count <= 5) histBuckets['2-5']++;
    else if (u.count <= 10) histBuckets['6-10']++;
    else if (u.count <= 25) histBuckets['11-25']++;
    else histBuckets['26+']++;
  }

  const histogram = Object.entries(histBuckets).map(([bucket, count]) => ({ bucket, count }));

  // Retention D1/D7/D30
  const now = new Date();
  let d1 = 0, d7 = 0, d30 = 0;
  for (const u of Object.values(userMap)) {
    const first = new Date(u.first);
    const daysSinceFirst = (now.getTime() - first.getTime()) / 86400000;
    // User retained = has more than 1 summary AND first summary > N days ago
    if (u.count > 1) {
      if (daysSinceFirst >= 1) d1++;
      if (daysSinceFirst >= 7) d7++;
      if (daysSinceFirst >= 30) d30++;
    }
  }

  const totalUsers = Object.keys(userMap).length;

  return {
    totalUsers,
    newUsers: Object.values(userMap).filter((u) => u.count === 1).length,
    returningUsers: Object.values(userMap).filter((u) => u.count > 1).length,
    histogram,
    retention: {
      d1: { count: d1, rate: totalUsers > 0 ? Math.round((d1 / totalUsers) * 100) : 0 },
      d7: { count: d7, rate: totalUsers > 0 ? Math.round((d7 / totalUsers) * 100) : 0 },
      d30: { count: d30, rate: totalUsers > 0 ? Math.round((d30 / totalUsers) * 100) : 0 },
    },
  };
}

export async function getErrorStats(from?: string, to?: string) {
  if (!supabase) throw new Error('DB not configured');

  // Taxonomy summary
  let taxQuery = supabase
    .from('summary_analytics')
    .select('error_type')
    .eq('status', 'failed')
    .not('error_type', 'is', null);
  if (from) taxQuery = taxQuery.gte('created_at', from);
  if (to) taxQuery = taxQuery.lte('created_at', to);

  const { data: taxRows } = await taxQuery;
  const taxMap: Record<string, number> = {};
  for (const r of taxRows ?? []) {
    taxMap[r.error_type] = (taxMap[r.error_type] ?? 0) + 1;
  }
  const taxonomy = Object.entries(taxMap)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Failed sessions log (last 100)
  let logQuery = supabase
    .from('summary_analytics')
    .select('id, video_id, error_type, error_message, user_id, created_at, processing_time_ms')
    .eq('status', 'failed')
    .order('created_at', { ascending: false })
    .limit(100);
  if (from) logQuery = logQuery.gte('created_at', from);
  if (to) logQuery = logQuery.lte('created_at', to);

  const { data: logRows } = await logQuery;

  return {
    taxonomy,
    totalFailed: (taxRows ?? []).length,
    failedSessions: (logRows ?? []).map((r) => ({
      id: r.id,
      videoId: r.video_id,
      errorType: r.error_type,
      errorMessage: r.error_message,
      userId: r.user_id,
      createdAt: r.created_at,
      processingTimeMs: r.processing_time_ms,
    })),
  };
}
