import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fetchVideoMetadata, fetchTranscript } from './services/youtube.js';
import { generateSummary } from './services/summarize.js';
import { translateSummaryContent } from './services/translate.js';
import { requireAuth } from './middleware/auth.js';
import { supabase } from './lib/supabase.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Generate summary for a YouTube video
app.post('/api/summarize', requireAuth, async (req, res) => {
  req.setTimeout(120_000);
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
      fetchTranscript(videoId),
    ]);

    const { text: transcript, languageCode: originalLanguage } = transcriptResult;

    console.log(
      `[summarize] Got transcript (${transcript.length} chars, lang=${originalLanguage}) for "${metadata.title}"`,
    );

    // Generate summary in the video's original language
    const summary = await generateSummary(transcript, metadata.title);

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

    if (message.includes('transcript')) {
      res.status(422).json({
        error: 'Could not fetch transcript. The video may not have captions available.',
      });
      return;
    }

    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// Translate an existing summary to a target language
app.post('/api/translate', requireAuth, async (req, res) => {
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

// Fetch video metadata only (for preview)
app.get('/api/video/:videoId', async (req, res) => {
  try {
    const metadata = await fetchVideoMetadata(req.params.videoId);
    res.json(metadata);
  } catch {
    res.status(404).json({ error: 'Video not found' });
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

server.timeout = 120_000;
server.keepAliveTimeout = 120_000;
