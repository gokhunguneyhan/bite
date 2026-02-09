export interface Summary {
  id: string;
  videoId: string;
  videoTitle: string;
  channelName: string;
  thumbnailUrl: string;
  quickSummary: string;
  contextualSections: ContextualSection[];
  refresherCards: RefresherCard[];
  actionableInsights: ActionableInsight[];
  affiliateLinks: AffiliateLink[];
  category: string;
  createdAt: string;
  language: string;
  originalLanguage: string;
  isPublic?: boolean;
  userId?: string;
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
  title: string;
  explanation: string;
  saved: boolean;
}

export interface ActionableInsight {
  category: string;
  insight: string;
}

export interface AffiliateLink {
  title: string;
  author?: string;
  url: string;
  type: 'book' | 'course' | 'tool' | 'website' | 'podcast';
  category: 'by_speaker' | 'recommended';
}

export interface CreatorSubscription {
  id: string;
  channelName: string;
  createdAt: string;
}
