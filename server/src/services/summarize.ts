import Anthropic from '@anthropic-ai/sdk';
import https from 'https';

const keepAliveAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30_000, // send TCP keepalive probes every 30s
});

const anthropic = new Anthropic({
  timeout: 120_000, // 2 minutes hard cap
  httpAgent: keepAliveAgent,
});

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
): Promise<SummaryResult> {
  const prompt = `You are an expert at transforming video content into written summaries that actually transfer knowledge — not just list topics, but explain ideas with the reasoning, stories, and context that make them memorable.

Video title: "${videoTitle}"

Transcript:
${transcript.slice(0, 30000)}

=== ADAPTIVE SCALING ===

Adapt your output depth based on the transcript's content density and length:

| Transcript Length       | Sections | Cards | Insights |
|-------------------------|----------|-------|----------|
| Short (< 2,000 words)   | 2-3      | 3-5   | 2-3      |
| Medium (2,000-5,000)    | 3-5      | 5-7   | 3-4      |
| Long (5,000-10,000)     | 4-6      | 6-8   | 3-5      |
| Very Long (> 10,000)    | 5-8      | 7-10  | 4-6      |

Estimate the transcript's word count and use the appropriate row. Prioritize depth over breadth — fewer excellent sections beat many shallow ones.

Return a JSON object with exactly this structure (no markdown, just raw JSON):
{
  "quickSummary": "2-3 sentences, 40-60 words",
  "contextualSections": [
    {
      "title": "Section title",
      "content": "200-400 words of flowing prose",
      "timestampStart": 0,
      "timestampEnd": 300
    }
  ],
  "refresherCards": [
    {
      "id": "rc1",
      "title": "Concept name or key principle",
      "explanation": "3-5 sentence explanation with story/context"
    }
  ],
  "actionableInsights": [
    {
      "category": "For [Relevant Area]",
      "insight": "Specific actionable takeaway with context"
    }
  ],
  "affiliateLinks": [
    {
      "title": "Resource Title",
      "author": "Author Name",
      "url": "https://www.amazon.com/s?k=TITLE+AUTHOR",
      "type": "book",
      "category": "by_speaker"
    }
  ],
  "category": "One category from the list below"
}

=== CRITICAL: CONTEXTUAL SECTIONS ===

This is the core of the summary. Each section should read like a well-written article, NOT bullet points.

For each contextual section:
- Title: Clear topic name
- Content: 200-400 words of flowing prose
- Include the WHY behind ideas, not just WHAT was said
- Preserve specific stories, examples, and anecdotes the speaker used
- Include concrete numbers, quotes, or data points that make ideas memorable
- Show how ideas connect to each other
- Write in a way where someone could explain this topic to a friend after reading
- Estimate timestampStart and timestampEnd as seconds based on position in transcript

BAD example (shallow):
"Ray Dalio discusses the five forces that shape economic cycles. These include debt, internal conflict, external conflict, acts of nature, and technology."

GOOD example (knowledge transfer):
"Ray Dalio didn't start as a historian. He started as an investor who kept getting blindsided by events he hadn't anticipated — things that had never happened in his lifetime but had happened many times throughout history. After nearly losing everything in 1982 by wrongly predicting an economic depression, he realized he needed to study patterns that stretched back centuries, not just decades. What emerged was a framework of five interconnected forces that create cycles lasting roughly 80 years. The first force is the debt and money cycle. When you give someone credit, they can spend more — which feels like prosperity. But credit creates debt, and debt must eventually be repaid. When there isn't enough income to service the debt, spending gets squeezed, and the system strains."

=== QUICK SUMMARY ===

2-3 sentences (40-60 words) that answer: "What is this video about and why should I care?"

=== REFRESHER CARDS ===

Create cards ONLY for ideas worth remembering. Don't pad the count.

Format:
{
  "title": "The concept name or key principle (short, memorable)",
  "explanation": "3-5 sentences explaining the concept WITH the story, example, or context that makes it stick"
}

The explanation should be SHAREABLE as a standalone insight. Someone could post just the explanation on social media and it would make sense and provide value.

BAD:
{
  "title": "Pain + Reflection = Progress",
  "explanation": "Dalio's formula for personal growth through learning from mistakes."
}

GOOD:
{
  "title": "Pain + Reflection = Progress",
  "explanation": "After losing everything in 1982 by wrongly predicting an economic depression, Dalio realized that painful experiences only become valuable if you pause to ask 'What does this teach me about how reality works?' He started writing down principles from every setback. In investing, he could computerize these principles and back-test them against decades of data. The pain wasn't the teacher - the reflection was."
}

BAD:
{
  "title": "The 80/20 Rule",
  "explanation": "Focus on the 20% of work that produces 80% of results."
}

GOOD:
{
  "title": "The 80/20 Rule (Applied Correctly)",
  "explanation": "The Pareto principle states that 80% of results come from 20% of efforts. But the speaker warns against a common misapplication: people identify their top 20% and then try to do MORE of it. The real leverage is eliminating or delegating the 80% that produces little value. The speaker cut their workload by 30% - not by working more on what worked, but by ruthlessly stopping what didn't."
}

=== ACTIONABLE INSIGHTS ===

Create insights with categories that emerge from THIS video's content.

Examples of how categories adapt to different videos:
- Finance video: "For Portfolio Management", "For Risk Assessment", "For Long-term Planning"
- Tutorial: "For Setup", "For Implementation", "For Troubleshooting"
- Self-improvement: "For Career", "For Relationships", "For Daily Habits"
- Business: "For Leadership", "For Operations", "For Growth"

Let the content dictate the categories. Don't use generic labels like "mindset" or "tool".

Each insight must be specific and practical — something someone could implement today. Start with a verb. Include WHY it matters based on the video.

Example: { "category": "For Decision-Making", "insight": "Build a principle system: When you make important decisions, document WHY you decided. When outcomes differ from expectations, pause and reflect: 'What does this reveal about how reality works?' Over time, you'll build a personal operating system tested against real outcomes." }

=== AFFILIATE LINKS / RESOURCES ===

Include books, courses, tools, websites, or podcasts referenced in the video.

- "by_speaker": Explicitly mentioned or recommended by the speaker
- "recommended": Closely related resources that complement the content

For type, use: "book", "course", "tool", "website", or "podcast".
Include the author if mentioned. Use an Amazon search URL for books.
If nothing is mentioned, return an empty array. Prefer "by_speaker" — only use "recommended" sparingly for highly relevant resources.

=== CATEGORY ===

Assign exactly one: Tech, Business, Science, Self-improvement, Health, Finance, Education, Entertainment, Productivity, Other

=== LANGUAGE ===

Write the entire summary in the same language as the transcript.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: prompt,
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
