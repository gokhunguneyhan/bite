import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

interface SummaryResult {
  quickSummary: string;
  contextualSections: {
    title: string;
    content: string;
    timestampStart: number;
    timestampEnd: number;
  }[];
  refresherCards: {
    id: string;
    frontText: string;
    backText: string;
  }[];
  actionableInsights: string[];
  affiliateLinks: {
    title: string;
    url: string;
    type: 'book' | 'resource';
  }[];
  category: string;
}

export async function generateSummary(
  transcript: string,
  videoTitle: string,
  language: string = 'en',
): Promise<SummaryResult> {
  const languageInstruction =
    language !== 'en'
      ? `\n\nIMPORTANT: Write ALL text content (summaries, sections, cards, insights) in ${language}. Only keep JSON keys in English.`
      : '';

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are a YouTube video summarizer. Analyze this transcript and produce a structured summary.

Video title: "${videoTitle}"

Transcript:
${transcript.slice(0, 50000)}

Return a JSON object with exactly this structure (no markdown, just raw JSON):
{
  "quickSummary": "A concise 2-3 sentence overview that captures the core message. Max 50 words.",
  "contextualSections": [
    {
      "title": "Section topic name",
      "content": "Detailed paragraph preserving reasoning, stories, and connections. 3-5 sentences. Write in a way that transfers real knowledge, not just bullet points.",
      "timestampStart": 0,
      "timestampEnd": 300
    }
  ],
  "refresherCards": [
    {
      "id": "rc1",
      "frontText": "A question about a key concept from the video",
      "backText": "A clear, concise answer that helps retention. 1-2 sentences."
    }
  ],
  "actionableInsights": [
    "A specific, practical action the viewer can take based on this video"
  ],
  "affiliateLinks": [
    {
      "title": "Book or resource mentioned in the video",
      "url": "https://www.amazon.com/s?k=BOOK+TITLE",
      "type": "book"
    }
  ],
  "category": "One of: Tech, Business, Science, Self-improvement, Health, Finance, Education, Entertainment, Productivity, Other"
}

Guidelines:
- Create 3-5 contextual sections covering the main topics
- Create 3-6 refresher cards for key concepts
- Create 2-4 actionable insights
- Only include affiliate links for books/resources explicitly mentioned in the video. If none are mentioned, return an empty array.
- Estimate timestamps based on position in transcript (divide transcript length proportionally)
- For contextual sections, preserve the speaker's reasoning and stories, don't just list facts
- Keep refresher card questions clear and specific, answers concise but complete
- Assign exactly one category from the list above that best fits the video${languageInstruction}`,
      },
    ],
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';

  // Extract JSON from response (handle potential markdown wrapping)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse summary response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as SummaryResult;

  // Ensure refresher card IDs
  parsed.refresherCards = parsed.refresherCards.map((card, i) => ({
    ...card,
    id: card.id || `rc${i + 1}`,
  }));

  return parsed;
}
