import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fetchVideoMetadata, fetchTranscript } from './services/youtube.js';
import { generateSummary } from './services/summarize.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Generate summary for a YouTube video
app.post('/api/summarize', async (req, res) => {
  const { videoId, language } = req.body;

  if (!videoId || typeof videoId !== 'string') {
    res.status(400).json({ error: 'videoId is required' });
    return;
  }

  const outputLanguage = typeof language === 'string' ? language : 'en';

  try {
    console.log(`[summarize] Starting for video: ${videoId}`);

    // Fetch metadata and transcript in parallel
    const [metadata, transcript] = await Promise.all([
      fetchVideoMetadata(videoId),
      fetchTranscript(videoId),
    ]);

    console.log(
      `[summarize] Got transcript (${transcript.length} chars) for "${metadata.title}"`,
    );

    // Generate summary with Claude
    const summary = await generateSummary(transcript, metadata.title, outputLanguage);

    console.log(`[summarize] Summary generated for "${metadata.title}"`);

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
      language: outputLanguage,
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

// Fetch video metadata only (for preview)
app.get('/api/video/:videoId', async (req, res) => {
  try {
    const metadata = await fetchVideoMetadata(req.params.videoId);
    res.json(metadata);
  } catch {
    res.status(404).json({ error: 'Video not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
