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
  isAnonymous?: boolean;
  analystName?: string;
  analystId?: string;
  analysisCount?: number;
}

export const CATEGORIES = [
  'Technology & AI',
  'Business & Startups',
  'Finance & Investing',
  'Science & Space',
  'Health & Fitness',
  'Self-Improvement',
  'Education & Learning',
  'Creative & Design',
  'Politics & Society',
  'Entertainment & Media',
  'Lifestyle & Culture',
  'Career & Professional Growth',
  'Other',
] as const;

/** Map old category names to new ones for backward compatibility */
const OLD_TO_NEW: Record<string, string> = {
  'Tech': 'Technology & AI',
  'Business': 'Business & Startups',
  'Finance': 'Finance & Investing',
  'Science': 'Science & Space',
  'Health': 'Health & Fitness',
  'Self-improvement': 'Self-Improvement',
  'Education': 'Education & Learning',
  'Entertainment': 'Entertainment & Media',
  'Productivity': 'Self-Improvement',
};

export function normalizeCategory(raw: string | undefined): string {
  if (!raw) return 'Other';
  return OLD_TO_NEW[raw] ?? raw;
}

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
