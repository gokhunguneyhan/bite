import type { Summary } from '@/src/types/summary';

export const MOCK_SUMMARY: Summary = {
  id: 'mock-summary-preview',
  videoId: 'dQw4w9WgXcQ',
  videoTitle: 'How to Learn Anything Fast — The Feynman Technique Explained',
  channelName: 'Ali Abdaal',
  thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  quickSummary:
    'Richard Feynman\'s learning technique boils down to four steps: pick a concept, teach it in simple language, identify gaps, and simplify further. This video explores how to apply these principles to any subject and retain knowledge long-term.',
  contextualSections: [
    {
      title: 'The Feynman Technique — Core Framework',
      content:
        'The Feynman Technique is a mental model for learning named after Nobel Prize-winning physicist Richard Feynman. The core idea: if you can\'t explain something simply, you don\'t understand it well enough.\n\nStep 1: Choose a concept you want to learn.\nStep 2: Teach it to a 12-year-old (or write it as if you were).\nStep 3: Identify gaps — where you stumbled or used jargon.\nStep 4: Review source material, fill the gaps, and simplify your explanation.\n\nThis forces active recall and exposes shallow understanding that passive reading hides.',
      timestampStart: 0,
      timestampEnd: 300,
    },
    {
      title: 'Why Most Study Methods Fail',
      content:
        'Highlighting, re-reading, and cramming feel productive but create an "illusion of competence." Research from cognitive psychology shows these methods barely improve long-term retention.\n\nActive recall (testing yourself) and spaced repetition (reviewing at increasing intervals) are the two most effective evidence-based strategies. The Feynman Technique combines both: teaching forces recall, and identifying gaps tells you what to review.',
      timestampStart: 300,
      timestampEnd: 600,
    },
    {
      title: 'Practical Applications',
      content:
        'You can apply this to any domain: coding, medicine, history, languages. The key insight is that simplification is not dumbing down — it\'s proof of deep understanding.\n\nTip 1: Use analogies. Comparing new ideas to things you already know creates stronger memory links.\nTip 2: Write, don\'t just think. The act of writing engages different cognitive pathways.\nTip 3: Teach someone else. If no one is available, explain to a rubber duck (seriously — it works).',
      timestampStart: 600,
      timestampEnd: 900,
    },
  ],
  refresherCards: [
    {
      id: 'mock-card-1',
      title: 'What are the 4 steps of the Feynman Technique?',
      explanation:
        '1. Choose a concept. 2. Teach it simply. 3. Identify gaps. 4. Review and simplify.',
      saved: false,
    },
    {
      id: 'mock-card-2',
      title: 'Why do highlighting and re-reading fail?',
      explanation:
        'They create an "illusion of competence" — feeling like you know something without actually being able to recall it.',
      saved: false,
    },
    {
      id: 'mock-card-3',
      title: 'What are the two most effective study strategies?',
      explanation:
        'Active recall (testing yourself) and spaced repetition (reviewing at increasing intervals).',
      saved: false,
    },
  ],
  actionableInsights: [
    {
      category: 'Learning',
      insight: 'Try explaining your current study topic to a friend without using jargon.',
    },
    {
      category: 'Productivity',
      insight:
        'Replace 30 minutes of re-reading with 15 minutes of active recall and review the gaps.',
    },
  ],
  affiliateLinks: [
    {
      title: 'Surely You\'re Joking, Mr. Feynman!',
      author: 'Richard Feynman',
      url: 'https://example.com/feynman-book',
      type: 'book',
      category: 'by_speaker',
    },
  ],
  category: 'Education',
  createdAt: new Date().toISOString(),
  language: 'en',
  originalLanguage: 'en',
  isPublic: true,
};
