export interface Summary {
  id: string;
  videoId: string;
  videoTitle: string;
  channelName: string;
  thumbnailUrl: string;
  quickSummary: string;
  contextualSections: ContextualSection[];
  refresherCards: RefresherCard[];
  actionableInsights: string[];
  affiliateLinks: AffiliateLink[];
  category: string;
  createdAt: string;
  language: string;
}

export const CATEGORIES = [
  'Tech',
  'Business',
  'Science',
  'Self-improvement',
  'Health',
  'Finance',
  'Education',
  'Entertainment',
  'Productivity',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface ContextualSection {
  title: string;
  content: string;
  timestampStart: number;
  timestampEnd: number;
}

export interface RefresherCard {
  id: string;
  frontText: string;
  backText: string;
  saved: boolean;
}

export interface AffiliateLink {
  title: string;
  url: string;
  type: 'book' | 'resource';
}
