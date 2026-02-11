import Anthropic from '@anthropic-ai/sdk';
import https from 'https';
import type { SummaryResult } from './summarize.js';

const keepAliveAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30_000,
});

const anthropic = new Anthropic({
  timeout: 150_000,
  httpAgent: keepAliveAgent,
});

/**
 * Static system prompt for the translator. Extracted as a constant so
 * Anthropic prompt caching can reuse it across requests (~80% cost reduction).
 */
const TRANSLATE_SYSTEM_PROMPT = `You are a professional translator for video summaries.

Rules:
- Translate ONLY the text values, keep all JSON structure intact
- Preserve numbers, URLs, and formatting
- Keep the category name in English (it's used for filtering)
- Return ONLY the translated JSON, no markdown or explanation`;

export async function translateSummaryContent(
  content: SummaryResult,
  fromLanguage: string,
  toLanguage: string,
): Promise<SummaryResult> {
  // Normalize actionableInsights to plain strings for translation (backward compat: old format is string[])
  const insightTexts = (content.actionableInsights as unknown[]).map((a) =>
    typeof a === 'string' ? a : (a as { insight: string }).insight,
  );

  const translatable = {
    quickSummary: content.quickSummary,
    contextualSections: content.contextualSections.map((s) => ({
      title: s.title,
      content: s.content,
    })),
    refresherCards: content.refresherCards.map((c: any) => ({
      title: c.title || c.frontText,
      explanation: c.explanation || c.backText,
    })),
    actionableInsights: insightTexts,
    affiliateLinks: content.affiliateLinks.map((l: any) => ({
      title: l.title,
      ...(l.author ? { author: l.author } : {}),
    })),
    category: content.category,
  };

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    system: [
      {
        type: 'text',
        text: TRANSLATE_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Translate the following summary content from ${fromLanguage} to ${toLanguage}.\n\n${JSON.stringify(translatable, null, 2)}`,
      },
    ],
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse translation response');
  }

  const translated = JSON.parse(jsonMatch[0]);

  // Merge translated text back, always returning new format (backward compat for old string[] insights)
  return {
    quickSummary: translated.quickSummary,
    contextualSections: content.contextualSections.map((s, i) => ({
      ...s,
      title: translated.contextualSections?.[i]?.title ?? s.title,
      content: translated.contextualSections?.[i]?.content ?? s.content,
    })),
    refresherCards: content.refresherCards.map((c: any, i) => ({
      id: c.id || `rc${i + 1}`,
      title: translated.refresherCards?.[i]?.title ?? c.title ?? c.frontText,
      explanation: translated.refresherCards?.[i]?.explanation ?? c.explanation ?? c.backText,
    })),
    actionableInsights: (content.actionableInsights as unknown[]).map((a, i) => ({
      category: typeof a === 'string' ? 'strategy' : ((a as any).category || 'strategy'),
      insight: translated.actionableInsights?.[i] ?? (typeof a === 'string' ? a : (a as any).insight),
    })),
    affiliateLinks: content.affiliateLinks.map((l: any, i) => ({
      title: translated.affiliateLinks?.[i]?.title ?? l.title,
      author: translated.affiliateLinks?.[i]?.author ?? l.author,
      url: l.url || '',
      type: l.type === 'resource' ? 'website' : (l.type || 'book'),
      category: l.category || 'by_speaker',
    })),
    category: content.category, // Keep category in English
  };
}
