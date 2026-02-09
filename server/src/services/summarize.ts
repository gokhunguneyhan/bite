import Anthropic from '@anthropic-ai/sdk';
import https from 'https';

const keepAliveAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30_000, // send TCP keepalive probes every 30s
});

const anthropic = new Anthropic({
  httpAgent: keepAliveAgent,
});

/**
 * Calculate a timeout (ms) based on transcript length.
 * ~1000 chars ≈ 1 minute of speech.
 */
export function calculateTimeoutMs(transcriptLength: number): number {
  const estimatedMinutes = transcriptLength / 1000;
  const seconds = Math.min(600, Math.max(120, Math.ceil(estimatedMinutes * 1.5) + 90));
  return seconds * 1000;
}

export interface SummaryResult {
  quickSummary: string;
  contextualSections: {
    title: string;
    content: string;
    timestampStart: number;
    timestampEnd: number;
  }[];
  refresherCards: {
    id: string;
    title: string;
    explanation: string;
  }[];
  actionableInsights: {
    category: string;
    insight: string;
  }[];
  affiliateLinks: {
    title: string;
    author?: string;
    url: string;
    type: 'book' | 'course' | 'tool' | 'website' | 'podcast';
    category: 'by_speaker' | 'recommended';
  }[];
  category: string;
}

export async function generateSummary(
  transcript: string,
  videoTitle: string,
  timeoutMs?: number,
): Promise<SummaryResult> {
  const prompt = `You are a Deep-Knowledge YouTube Summarizer that produces summaries enabling true knowledge transfer - not just listing topics, but explaining ideas with reasoning, stories, and context that make them memorable.

Video title: "${videoTitle}"

Transcript:
${transcript}

---

### Thinking Patterns (apply these)
- **The Cold Open** – start each section with a vivid moment before zooming out
- **The Curiosity Gap** – pose a question early, resolve it later, then create a new gap
- **The Unexpected Angle** – offer a surprising perspective that forces re-evaluation
- **The Concrete Abstraction** – anchor any abstract model with a real-world analogy or story from the video

### Anti-Patterns (avoid these)
- **NO Throat Clear** – drop any intro that doesn't hook the reader
- **NO Wikipedia Voice** – avoid detached, list-like exposition; use conversational tone
- **NO Expertise Flex** – replace jargon with plain language; define unavoidable terms in one sentence
- **NO Endless Scroll** – keep paragraphs ≤ 4 sentences
- **NO Vague Claims** – back every statement with a specific example, quote, or numeric detail
- **NO Vague Attribution** – avoid "someone asks" or "the interviewer says" when possible; use the host's name if mentioned in transcript, or rephrase to focus on the speaker directly

---

### Scaling (adapt to video length)

| Video Length | Sections | Total Words | Cards | Insights |
|--------------|----------|-------------|-------|----------|
| 10-20 min    | 2-3      | 800-1,200   | 3-4   | 2-3      |
| 20-40 min    | 3-4      | 1,200-1,800 | 4-5   | 3-4      |
| 40-90 min    | 4-6      | 1,800-2,800 | 5-7   | 4-5      |
| 90+ min      | 5-7      | 2,500-3,500 | 6-8   | 4-6      |

---

Return a JSON object with this exact structure (raw JSON only, no markdown):
{
  "quickSummary": "2-3 sentence hook answering 'What's this about and why care?'",
  "contextualSections": [
    {
      "title": "Descriptive chapter heading",
      "content": "200-500 word flowing prose. Includes stories, numbers, quotes, and connective explanations. No bullet points.",
      "timestampStart": 0,
      "timestampEnd": 300
    }
  ],
  "refresherCards": [
    {
      "id": "rc1",
      "title": "Concept name",
      "explanation": "3-5 sentence story-rich explanation that could stand alone as a social media post"
    }
  ],
  "actionableInsights": [
    {
      "category": "For [Relevant Area from THIS video]",
      "insight": "Verb-lead sentence + why-it-matters (2-3 sentences total)"
    }
  ],
  "affiliateLinks": [
    {
      "title": "Book/Resource Title",
      "author": "Author Name",
      "url": "https://www.amazon.com/s?k=TITLE+AUTHOR",
      "type": "book",
      "category": "by_speaker"
    }
  ],
  "category": "Tech|Business|Science|Self-improvement|Health|Finance|Education|Entertainment|Productivity|Other"
}

---

### Field Instructions

**contextualSections:**
- Apply Cold Open: start with a vivid moment, not a summary statement
- Each section reads like a mini-article, not a list
- Preserve stories, quotes, and numbers verbatim
- Include WHY behind ideas, not just WHAT
- Timestamps as seconds based on transcript position

**refresherCards:**
- Capture the STORY behind each concept
- Explanation must be shareable standalone
- Only create cards for ideas truly worth remembering

**actionableInsights:**
- Categories emerge from THIS video's content (e.g., "For Retirement Planning", "For Home Buying", "For Daily Habits")
- Don't use generic labels like "mindset" or "tool"
- Each must be specific enough to implement today

**affiliateLinks:**
- by_speaker: created by or explicitly recommended by speaker
- recommended: if nothing mentioned, suggest up to 3 relevant books BY THE SPEAKER
- Use Amazon search URL format

---

### Quality Checklist (verify before outputting)
☐ Each section opens with a vivid moment, not a dry summary
☐ Sections read like mini-articles, not lists
☐ Stories, quotes, and numbers retained verbatim
☐ Cards capture the story behind each concept
☐ Insights start with a verb and explain the benefit
☐ Voice is engaging and conversational, not Wikipedia-style
☐ No jargon without definition
☐ JSON keys match schema exactly

Write in the same language as the transcript.`;

  console.log(`[summarize] Sending ${transcript.length} chars (~${Math.round(transcript.length / 4)} tokens) to Claude`);

  const requestTimeout = timeoutMs ?? calculateTimeoutMs(transcript.length);
  console.log(`[summarize] Timeout set to ${requestTimeout / 1000}s`);

  // Stream the response to keep the TCP connection alive during Claude's processing.
  // Without streaming, the socket sits idle while Claude reads 40K+ tokens,
  // and macOS kills it with ETIMEDOUT after ~120s of silence.
  const stream = anthropic.messages.stream(
    {
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16384,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    },
    { timeout: requestTimeout },
  );

  const response = await stream.finalMessage();

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';

  console.log(`[summarize] Claude response: ${text.length} chars, stop_reason=${response.stop_reason}, usage=${JSON.stringify(response.usage)}`);

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
