import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { fetchVideoMetadata, getTranscriptWithFallback } from './services/youtube.js';
import { getCachedSummary, calculateTimeoutMs } from './services/summarize.js';
import { translateSummaryContent } from './services/translate.js';
import { getOrGenerateAudio } from './services/tts.js';
import rateLimit from 'express-rate-limit';
import { requireAuth } from './middleware/auth.js';
import { supabase } from './lib/supabase.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

// Serve static files (admin dashboard)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = resolve(__dirname, '..', 'public');

// Rate limiting
const summarizeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 20, // max 20 summarizations per hour per IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

const translateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many translation requests. Please try again later.' },
});

const ttsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'TTS rate limit exceeded. Try again later.' },
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Admin dashboard
app.get('/admin', (_req, res) => {
  const html = readFileSync(join(publicDir, 'admin.html'), 'utf-8');
  res.type('html').send(html);
});

// Generate summary for a YouTube video
app.post('/api/summarize', summarizeLimiter, requireAuth, async (req, res) => {
  const { videoId } = req.body;

  if (!videoId || typeof videoId !== 'string') {
    res.status(400).json({ error: 'videoId is required' });
    return;
  }

  try {
    console.log(`[summarize] Starting for video: ${videoId}`);

    // Fetch metadata and transcript in parallel
    const [metadata, transcriptResult] = await Promise.all([
      fetchVideoMetadata(videoId),
      getTranscriptWithFallback(videoId),
    ]);

    const { text: transcript, languageCode: originalLanguage, durationSeconds } = transcriptResult;

    const timeoutMs = calculateTimeoutMs(transcript.length);
    req.setTimeout(timeoutMs);

    console.log(
      `[summarize] Got transcript (${transcript.length} chars, lang=${originalLanguage}, duration=${Math.round(durationSeconds / 60)}min) for "${metadata.title}" — timeout ${timeoutMs / 1000}s`,
    );

    // Generate summary in the video's original language (with caching)
    // Task 1: Result Caching - Check cache first, generate if miss, store if hit
    const summary = await getCachedSummary(
      videoId,
      transcript,
      metadata.title,
      metadata.channelName,
      durationSeconds,
      timeoutMs,
    );

    console.log(`[summarize] Summary generated for "${metadata.title}"`);

    const summaryData = {
      video_id: videoId,
      video_title: metadata.title,
      channel_name: metadata.channelName,
      thumbnail_url: metadata.thumbnailUrl,
      quick_summary: summary.quickSummary,
      contextual_sections: summary.contextualSections,
      refresher_cards: summary.refresherCards.map((card) => ({
        ...card,
        saved: false,
      })),
      actionable_insights: summary.actionableInsights,
      affiliate_links: summary.affiliateLinks,
      category: summary.category || 'Other',
      language: originalLanguage,
      original_language: originalLanguage,
      user_id: req.user!.id,
    };

    // Insert into Supabase if available
    if (supabase) {
      const { data: dbRecord, error: dbError } = await supabase
        .from('summaries')
        .insert(summaryData)
        .select()
        .single();

      if (dbError) {
        console.error('[summarize] DB insert error:', dbError);
      } else {
        res.json(mapDbToSummary(dbRecord));
        return;
      }
    }

    // Fallback if Supabase not configured or insert failed
    res.json({
      id: String(Date.now()),
      videoId,
      videoTitle: metadata.title,
      channelName: metadata.channelName,
      thumbnailUrl: metadata.thumbnailUrl,
      quickSummary: summary.quickSummary,
      contextualSections: summary.contextualSections,
      refresherCards: summary.refresherCards.map((card) => ({
        ...card,
        saved: false,
      })),
      actionableInsights: summary.actionableInsights,
      affiliateLinks: summary.affiliateLinks,
      category: summary.category || 'Other',
      createdAt: new Date().toISOString(),
      language: originalLanguage,
      originalLanguage,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(`[summarize] Error:`, error);

    if (message.includes('[VIDEO_UNAVAILABLE]')) {
      res.status(404).json({
        error: 'This video is unavailable. It may be private, deleted, or region-restricted.',
      });
      return;
    }

    if (message.includes('[RATE_LIMITED]')) {
      res.status(429).json({
        error: 'Too many requests. Please try again in a moment.',
      });
      return;
    }

    if (message.includes('[NO_CAPTIONS]') || message.includes('transcript')) {
      res.status(422).json({
        error: 'Could not fetch transcript. The video may not have captions available.',
      });
      return;
    }

    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// Translate an existing summary to a target language
app.post('/api/translate', translateLimiter, requireAuth, async (req, res) => {
  const { summaryId, targetLanguage } = req.body;

  if (!summaryId || !targetLanguage) {
    res.status(400).json({ error: 'summaryId and targetLanguage are required' });
    return;
  }

  try {
    if (!supabase) {
      res.status(500).json({ error: 'Database not configured' });
      return;
    }

    // Check cache first
    const { data: cached } = await supabase
      .from('summary_translations')
      .select('translated_content')
      .eq('summary_id', summaryId)
      .eq('language_code', targetLanguage)
      .single();

    if (cached) {
      res.json(cached.translated_content);
      return;
    }

    // Fetch original summary
    const { data: summary, error: fetchError } = await supabase
      .from('summaries')
      .select('*')
      .eq('id', summaryId)
      .single();

    if (fetchError || !summary) {
      res.status(404).json({ error: 'Summary not found' });
      return;
    }

    const originalContent = {
      quickSummary: summary.quick_summary,
      contextualSections: summary.contextual_sections,
      refresherCards: summary.refresher_cards,
      actionableInsights: summary.actionable_insights,
      affiliateLinks: summary.affiliate_links,
      category: summary.category,
    };

    const translated = await translateSummaryContent(
      originalContent,
      summary.original_language,
      targetLanguage,
    );

    // Cache result
    await supabase.from('summary_translations').insert({
      summary_id: summaryId,
      language_code: targetLanguage,
      translated_content: translated,
    });

    res.json(translated);
  } catch (error) {
    console.error('[translate] Error:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});

// ── Audio TTS endpoint ──
app.post('/api/tts', ttsLimiter, requireAuth, async (req, res) => {
  try {
    const { summaryId } = req.body;

    if (!summaryId) {
      res.status(400).json({ error: 'summaryId is required' });
      return;
    }

    if (!supabase) {
      res.status(500).json({ error: 'Database not configured' });
      return;
    }

    const { data: summary, error: fetchError } = await supabase
      .from('summaries')
      .select('id, quick_summary, contextual_sections, video_title')
      .eq('id', summaryId)
      .single();

    if (fetchError || !summary) {
      res.status(404).json({ error: 'Summary not found' });
      return;
    }

    const sections = (summary.contextual_sections || []) as Array<{
      title: string;
      content: string;
    }>;

    const narrationParts = [
      summary.video_title,
      '',
      summary.quick_summary,
      '',
      ...sections.flatMap((s) => [s.title, s.content, '']),
    ];

    const fullText = narrationParts.join('\n').trim();
    // OpenAI TTS has a 4096 char limit per request — truncate for MVP
    const truncatedText = fullText.slice(0, 4096);

    const result = await getOrGenerateAudio({
      summaryId,
      text: truncatedText,
      videoTitle: summary.video_title,
    });

    res.json(result);
  } catch (err: any) {
    console.error('[tts] Error:', err.message);
    res.status(500).json({ error: 'Audio generation failed' });
  }
});

// Toggle publish status for a summary
app.post('/api/summaries/:id/publish', requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    if (!supabase) {
      res.status(500).json({ error: 'Database not configured' });
      return;
    }

    // Fetch the summary and verify ownership
    const { data: summary, error: fetchError } = await supabase
      .from('summaries')
      .select('id, user_id, is_public')
      .eq('id', id)
      .single();

    if (fetchError || !summary) {
      res.status(404).json({ error: 'Summary not found' });
      return;
    }

    if (summary.user_id !== req.user!.id) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const newValue = !summary.is_public;
    const { error: updateError } = await supabase
      .from('summaries')
      .update({ is_public: newValue })
      .eq('id', id);

    if (updateError) {
      res.status(500).json({ error: 'Failed to update' });
      return;
    }

    res.json({ isPublic: newValue });
  } catch (error) {
    console.error('[publish] Error:', error);
    res.status(500).json({ error: 'Failed to toggle publish status' });
  }
});

// Get public community summaries
app.get('/api/community', async (_req, res) => {
  try {
    if (!supabase) {
      res.status(500).json({ error: 'Database not configured' });
      return;
    }

    const { data, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      res.status(500).json({ error: 'Failed to fetch community summaries' });
      return;
    }

    res.json((data ?? []).map(mapDbToSummary));
  } catch (error) {
    console.error('[community] Error:', error);
    res.status(500).json({ error: 'Failed to fetch community summaries' });
  }
});

// Fetch video metadata only (for preview)
app.get('/api/video/:videoId', async (req, res) => {
  try {
    const metadata = await fetchVideoMetadata(req.params.videoId);
    res.json(metadata);
  } catch {
    res.status(404).json({ error: 'Video not found' });
  }
});

// Task 3: Analytics Endpoints

/**
 * Get most popular videos (by request count)
 * Used to identify which videos benefit most from caching
 */
app.get('/api/admin/popular-videos', async (req, res) => {
  try {
    if (!supabase) {
      res.status(500).json({ error: 'Database not configured' });
      return;
    }

    const { data, error } = await supabase
      .from('summary_cache')
      .select('video_id, video_title, channel_name, request_count, created_at')
      .order('request_count', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[analytics] Popular videos query failed:', error);
      res.status(500).json({ error: 'Failed to fetch popular videos' });
      return;
    }

    console.log(`[analytics] Popular videos: ${(data ?? []).length} entries`);

    res.json({
      success: true,
      videos: data ?? [],
      totalCached: (data ?? []).length,
    });
  } catch (error: any) {
    console.error('[analytics] Popular videos exception:', error);
    res.status(500).json({ error: error.message || 'Unknown error' });
  }
});

/**
 * Get cache statistics
 * Shows hit rate, total requests, unique videos, avg requests per video
 */
app.get('/api/admin/cache-stats', async (req, res) => {
  try {
    if (!supabase) {
      res.status(500).json({ error: 'Database not configured' });
      return;
    }

    const { data, error } = await supabase.from('summary_cache').select('request_count');

    if (error) {
      console.error('[analytics] Cache stats query failed:', error);
      res.status(500).json({ error: 'Failed to fetch cache stats' });
      return;
    }

    const cacheData = data ?? [];

    // Calculate metrics
    const totalRequests = cacheData.reduce((sum, row) => sum + row.request_count, 0);
    const uniqueVideos = cacheData.length;

    // Cache hit rate = (total requests - unique videos) / total requests * 100
    // Because each unique video = 1 generation, rest are cache hits
    const cacheHitRate =
      uniqueVideos > 0 ? (((totalRequests - uniqueVideos) / totalRequests) * 100).toFixed(2) : '0.00';

    const avgRequestsPerVideo = uniqueVideos > 0 ? (totalRequests / uniqueVideos).toFixed(2) : '0.00';

    const costSavings = {
      totalGenerations: uniqueVideos,
      totalCacheHits: Math.max(0, totalRequests - uniqueVideos),
      costPerGeneration: 0.11, // Claude Sonnet 4.5 summarization (~25K input tokens × $3/M + ~1K output tokens × $15/M)
      savedCost: ((totalRequests - uniqueVideos) * 0.11).toFixed(2),
      totalCost: (uniqueVideos * 0.11).toFixed(2),
    };

    console.log(
      `[analytics] Cache stats: ${totalRequests} requests, ${uniqueVideos} unique videos, ${cacheHitRate}% hit rate`,
    );

    res.json({
      success: true,
      stats: {
        totalRequests,
        uniqueVideos,
        cacheHitRate: `${cacheHitRate}%`,
        avgRequestsPerVideo,
        costSavings,
      },
    });
  } catch (error: any) {
    console.error('[analytics] Cache stats exception:', error);
    res.status(500).json({ error: error.message || 'Unknown error' });
  }
});

function mapDbToSummary(row: Record<string, unknown>) {
  return {
    id: row.id,
    videoId: row.video_id,
    videoTitle: row.video_title,
    channelName: row.channel_name,
    thumbnailUrl: row.thumbnail_url,
    quickSummary: row.quick_summary,
    contextualSections: row.contextual_sections,
    refresherCards: row.refresher_cards,
    actionableInsights: row.actionable_insights,
    affiliateLinks: row.affiliate_links,
    category: row.category,
    createdAt: row.created_at,
    language: row.language || row.original_language || 'en',
    originalLanguage: row.original_language || row.language || 'en',
    userId: row.user_id,
    isPublic: row.is_public,
  };
}

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

server.timeout = 600_000;
server.keepAliveTimeout = 600_000;
