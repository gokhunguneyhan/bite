import type { Summary } from '@/src/types/summary';

export const MOCK_SUMMARIES: Summary[] = [
  {
    id: '1',
    videoId: 'dQw4w9WgXcQ',
    videoTitle: 'How to Build Better Habits: Lessons from Atomic Habits',
    channelName: 'Ali Abdaal',
    thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    quickSummary:
      'James Clear\'s Atomic Habits framework breaks down habit formation into four laws: make it obvious, attractive, easy, and satisfying. The key insight is that small 1% improvements compound into remarkable results over time. Focus on systems rather than goals, and build your identity around the type of person you want to become.',
    contextualSections: [
      {
        title: 'The Power of Tiny Changes',
        content:
          'The core premise challenges our obsession with big transformations. Clear argues that a 1% improvement each day leads to being 37x better after a year. The math is compelling, but the real insight is psychological: small changes don\'t trigger the resistance that ambitious goals do. He uses the British cycling team as a case study \u2014 they went from mediocre to dominant by optimizing hundreds of tiny details, from pillow firmness to hand-washing technique.',
        timestampStart: 0,
        timestampEnd: 245,
      },
      {
        title: 'Identity-Based Habits',
        content:
          'This is where the book diverges from typical self-help. Instead of starting with outcomes (\"I want to lose weight\") or processes (\"I need to go to the gym\"), Clear advocates starting with identity: \"I am a healthy person.\" Every action becomes a vote for the type of person you want to be. This reframe is powerful because it shifts motivation from external rewards to internal alignment.',
        timestampStart: 246,
        timestampEnd: 480,
      },
      {
        title: 'The Four Laws of Behavior Change',
        content:
          'The practical framework: (1) Cue \u2014 make it obvious by designing your environment. Put the guitar in the middle of the room, not in the closet. (2) Craving \u2014 make it attractive by pairing habits you need to do with habits you want to do (temptation bundling). (3) Response \u2014 make it easy by reducing friction. The two-minute rule: any new habit should take less than two minutes to start. (4) Reward \u2014 make it satisfying with immediate positive feedback.',
        timestampStart: 481,
        timestampEnd: 720,
      },
      {
        title: 'Environment Design Over Willpower',
        content:
          'One of the most practical takeaways: you don\'t rise to the level of your goals, you fall to the level of your systems. Rather than relying on motivation (which is unreliable), redesign your environment to make good habits the path of least resistance. People who appear disciplined are often just better at structuring their environment to avoid temptation in the first place.',
        timestampStart: 721,
        timestampEnd: 900,
      },
    ],
    refresherCards: [
      {
        id: 'rc1',
        frontText: 'What is the 1% rule?',
        backText:
          'Small daily improvements compound: 1% better each day = 37x better after one year. Focus on tiny changes, not big transformations.',
        saved: false,
      },
      {
        id: 'rc2',
        frontText: 'What are identity-based habits?',
        backText:
          'Start with who you want to BE, not what you want to ACHIEVE. Every action is a vote for your desired identity. "I am a healthy person" beats "I want to lose 20 lbs."',
        saved: false,
      },
      {
        id: 'rc3',
        frontText: 'What is the Two-Minute Rule?',
        backText:
          'Any new habit should take less than two minutes to start. "Read before bed" becomes "Read one page." The point is to master showing up before optimizing.',
        saved: false,
      },
      {
        id: 'rc4',
        frontText: 'What is temptation bundling?',
        backText:
          'Pair a habit you NEED to do with something you WANT to do. Example: only listen to your favorite podcast while exercising.',
        saved: false,
      },
      {
        id: 'rc5',
        frontText: 'Why does environment matter more than willpower?',
        backText:
          'You fall to the level of your systems, not rise to the level of your goals. Disciplined people design environments that remove the need for discipline.',
        saved: false,
      },
    ],
    actionableInsights: [
      'Audit your current habits using a habit scorecard \u2014 write down every daily behavior and mark it +, -, or =',
      'Pick ONE tiny habit to start this week using the two-minute rule',
      'Redesign one area of your environment to make a good habit easier (e.g., lay out gym clothes the night before)',
      'Try temptation bundling: pair something you need to do with something you enjoy',
    ],
    affiliateLinks: [
      {
        title: 'Atomic Habits by James Clear',
        url: 'https://www.amazon.com/dp/0735211299',
        type: 'book',
      },
      {
        title: 'The Power of Habit by Charles Duhigg',
        url: 'https://www.amazon.com/dp/081298160X',
        type: 'book',
      },
    ],
    createdAt: new Date().toISOString(),
    language: 'en',
  },
  {
    id: '2',
    videoId: 'abc123def45',
    videoTitle: 'The Psychology of Money: Timeless Lessons on Wealth',
    channelName: 'The Swedish Investor',
    thumbnailUrl: 'https://img.youtube.com/vi/abc123def45/hqdefault.jpg',
    quickSummary:
      'Morgan Housel\'s key insight: financial success is more about behavior than intelligence. Your personal experiences with money shape your worldview in ways that make your decisions seem rational to you but crazy to others. The most important financial skill is getting the goalpost to stop moving.',
    contextualSections: [
      {
        title: 'No One Is Crazy',
        content:
          'Everyone makes financial decisions based on their unique experiences. Someone who grew up during hyperinflation views money fundamentally differently than someone raised in stable prosperity. Neither is wrong \u2014 they\'re both responding rationally to their lived experience. This explains why financial advice that seems obvious to one person feels impossible to another.',
        timestampStart: 0,
        timestampEnd: 300,
      },
      {
        title: 'Compounding Is Unintuitive',
        content:
          'Warren Buffett\'s net worth is $84.5 billion. Of that, $84.2 billion came after his 50th birthday. He started investing at age 10. The key isn\'t returns \u2014 it\'s time. Compounding works best when you give it decades of runway. The counterintuitive lesson: being a pretty good investor who starts early and stays consistent will outperform a brilliant investor who starts late.',
        timestampStart: 301,
        timestampEnd: 600,
      },
    ],
    refresherCards: [
      {
        id: 'rc6',
        frontText: 'Why is "no one crazy" with money?',
        backText:
          'Everyone\'s financial decisions are shaped by their unique life experiences. What seems irrational to you may be perfectly logical given someone else\'s background.',
        saved: false,
      },
      {
        id: 'rc7',
        frontText: 'What makes compounding so powerful?',
        backText:
          '$81.5B of Buffett\'s $84.5B net worth came after age 50. Time is more important than returns. Consistency over decades beats brilliance over years.',
        saved: false,
      },
    ],
    actionableInsights: [
      'Define your "enough" \u2014 write down what financial goalpost would let you stop chasing more',
      'Calculate how much time you have in the market, not timing the market',
    ],
    affiliateLinks: [
      {
        title: 'The Psychology of Money by Morgan Housel',
        url: 'https://www.amazon.com/dp/0857197681',
        type: 'book',
      },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    language: 'en',
  },
];

let mockSummaries = [...MOCK_SUMMARIES];

export function getMockSummaries(): Summary[] {
  return mockSummaries;
}

export function getMockSummary(id: string): Summary | undefined {
  return mockSummaries.find((s) => s.id === id);
}

export function addMockSummary(videoId: string): Summary {
  const newSummary: Summary = {
    ...MOCK_SUMMARIES[0],
    id: String(Date.now()),
    videoId,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    createdAt: new Date().toISOString(),
  };
  mockSummaries = [newSummary, ...mockSummaries];
  return newSummary;
}
