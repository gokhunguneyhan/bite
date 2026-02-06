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
  createdAt: string;
  language: string;
}

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
