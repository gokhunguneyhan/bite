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
        title: 'The 1% Rule',
        explanation:
          'James Clear argues that a 1% improvement each day leads to being 37x better after a year. The math is compelling, but the real insight is psychological: small changes don\'t trigger the resistance that ambitious goals do. The British cycling team proved this by going from mediocre to dominant — not through one big change, but by optimizing hundreds of tiny details, from pillow firmness to hand-washing technique.',
        saved: false,
      },
      {
        id: 'rc2',
        title: 'Identity-Based Habits',
        explanation:
          'Instead of starting with outcomes ("I want to lose weight") or processes ("I need to go to the gym"), Clear advocates starting with identity: "I am a healthy person." Every action becomes a vote for the type of person you want to be. This reframe shifts motivation from external rewards to internal alignment. You don\'t need willpower when your habits match who you believe you are.',
        saved: false,
      },
      {
        id: 'rc3',
        title: 'The Two-Minute Rule',
        explanation:
          'Any new habit should take less than two minutes to start. "Read before bed" becomes "Read one page." "Do yoga" becomes "Roll out the mat." The point isn\'t the two minutes — it\'s mastering the art of showing up. Once you\'ve standardized showing up, you can optimize the details later. The hardest part of any habit is starting.',
        saved: false,
      },
      {
        id: 'rc4',
        title: 'Temptation Bundling',
        explanation:
          'Pair a habit you NEED to do with something you WANT to do. Only listen to your favorite podcast while exercising. Only watch Netflix while on the treadmill. This leverages the brain\'s reward system by linking the dopamine hit of something enjoyable to the behavior you\'re trying to build. It transforms "I have to" into "I get to."',
        saved: false,
      },
      {
        id: 'rc5',
        title: 'Environment Design Over Willpower',
        explanation:
          'You don\'t rise to the level of your goals — you fall to the level of your systems. People who appear disciplined are often just better at structuring their environment. Put the guitar in the middle of the room, not in the closet. Lay out gym clothes the night before. The key insight: remove the need for willpower rather than trying to build more of it.',
        saved: false,
      },
    ],
    actionableInsights: [
      { category: 'tool', insight: 'Audit your current habits using a habit scorecard \u2014 write down every daily behavior and mark it +, -, or =' },
      { category: 'habit', insight: 'Pick ONE tiny habit to start this week using the two-minute rule' },
      { category: 'strategy', insight: 'Redesign one area of your environment to make a good habit easier (e.g., lay out gym clothes the night before)' },
      { category: 'tool', insight: 'Try temptation bundling: pair something you need to do with something you enjoy' },
    ],
    affiliateLinks: [
      {
        title: 'Atomic Habits',
        author: 'James Clear',
        url: 'https://www.amazon.com/dp/0735211299',
        type: 'book',
        category: 'by_speaker',
      },
      {
        title: 'The Power of Habit',
        author: 'Charles Duhigg',
        url: 'https://www.amazon.com/dp/081298160X',
        type: 'book',
        category: 'recommended',
      },
    ],
    category: 'Self-improvement',
    createdAt: new Date().toISOString(),
    language: 'en',
    originalLanguage: 'en',
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
        title: 'No One Is Crazy With Money',
        explanation:
          'Everyone makes financial decisions based on their unique experiences. Someone who grew up during hyperinflation views money fundamentally differently than someone raised in stable prosperity. Neither is wrong — they\'re both responding rationally to their lived experience. This explains why financial advice that seems obvious to one person feels impossible to another.',
        saved: false,
      },
      {
        id: 'rc7',
        title: 'The Power of Compounding',
        explanation:
          'Warren Buffett\'s net worth is $84.5 billion. Of that, $84.2 billion came after his 50th birthday — and he started investing at age 10. The key isn\'t getting extraordinary returns; it\'s time. A pretty good investor who starts early and stays consistent will outperform a brilliant investor who starts late. Compounding rewards patience above all else.',
        saved: false,
      },
    ],
    actionableInsights: [
      { category: 'mindset', insight: 'Define your "enough" \u2014 write down what financial goalpost would let you stop chasing more' },
      { category: 'strategy', insight: 'Calculate how much time you have in the market, not timing the market' },
    ],
    affiliateLinks: [
      {
        title: 'The Psychology of Money',
        author: 'Morgan Housel',
        url: 'https://www.amazon.com/dp/0857197681',
        type: 'book',
        category: 'by_speaker',
      },
    ],
    category: 'Finance',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    language: 'en',
    originalLanguage: 'en',
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
