import { useQuery } from '@tanstack/react-query';
import { fetchCategoryVideos } from '../services/youtubeRssService';
import { FEATURED_CREATORS, type FeaturedCreator } from '../constants/featuredCreators';

/**
 * React Query hook that fetches real YouTube videos for a given category
 * via public RSS feeds. Disabled for 'All', 'Trending', and null categories.
 */
export function useCategoryVideos(category: string | null) {
  return useQuery({
    queryKey: ['category-videos', category],
    queryFn: () => fetchCategoryVideos(category!),
    enabled: !!category && category !== 'All' && category !== 'Trending',
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Return FEATURED_CREATORS whose category matches the given string
 * (case-insensitive includes). For 'All' or 'Trending' returns the
 * first 6 creators as a representative sample.
 */
export function getCategoryCreators(category: string): FeaturedCreator[] {
  if (category === 'All' || category === 'Trending') {
    return FEATURED_CREATORS.slice(0, 6);
  }

  const lower = category.toLowerCase();
  return FEATURED_CREATORS.filter(
    (c) =>
      c.category.toLowerCase().includes(lower) ||
      lower.includes(c.category.toLowerCase()),
  );
}
