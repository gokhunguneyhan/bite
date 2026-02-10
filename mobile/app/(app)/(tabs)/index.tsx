import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useMemo } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/src/constants/colors';
import {
  useSummaries,
  useCommunitySummaries,
  useSubscriptions,
  useImportYouTubeSubscriptions,
} from '@/src/hooks/useSummary';
import { usePreferences, useOnboardingStatus } from '@/src/hooks/usePreferences';
import { useDueCards } from '@/src/hooks/useSpacedRepetition';
import { VerticalVideoCard } from '@/src/components/summary/VerticalVideoCard';
import { useToast } from '@/src/components/ui/Toast';
import { getChannelLatestVideos } from '@/src/services/youtubeImportService';
import { FEATURED_CREATORS } from '@/src/constants/featuredCreators';
import { MOCK_CHANNEL_VIDEOS, type YouTubeVideo } from '@/src/mocks/youtubeSubscriptions';
import type { Summary } from '@/src/types/summary';

type FeedEntry =
  | { type: 'summary'; data: Summary }
  | { type: 'personalise' }
  | { type: 'refresher'; data: Summary }
  | { type: 'suggestion'; data: YouTubeVideo };

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data: summaries, isLoading } = useSummaries();
  const { data: communitySummaries, isLoading: isCommunityLoading } =
    useCommunitySummaries();
  const { data: preferences } = usePreferences();
  const { data: subscriptions } = useSubscriptions();
  const { data: dueCards } = useDueCards();
  const { data: hasOnboarded } = useOnboardingStatus();
  const showToast = useToast();
  const importMutation = useImportYouTubeSubscriptions();

  const dueCount = dueCards?.length ?? 0;
  const hasPersonalised = hasOnboarded === true;
  const hasSubscriptions = (subscriptions?.length ?? 0) > 0;

  // Summaries that have refresher cards
  const summariesWithCards = useMemo(
    () => summaries?.filter((s) => s.refresherCards?.length > 0) ?? [],
    [summaries],
  );

  // Community summaries filtered by user's preferred categories
  const communitySummariesFiltered = useMemo(() => {
    if (!communitySummaries) return [];
    if (preferences?.preferredCategories?.length) {
      const cats = preferences.preferredCategories.map((c) => c.toLowerCase());
      const filtered = communitySummaries.filter(
        (s) => s.category && cats.includes(s.category.toLowerCase()),
      );
      return filtered.length > 0 ? filtered : communitySummaries;
    }
    return communitySummaries;
  }, [communitySummaries, preferences?.preferredCategories]);

  // Gather video suggestions from subscriptions + interests/categories
  const suggestions = useMemo(() => {
    const seen = new Set<string>();
    const result: YouTubeVideo[] = [];

    // From subscribed channels
    if (subscriptions) {
      for (const sub of subscriptions) {
        for (const v of getChannelLatestVideos(sub.channelName)) {
          if (!seen.has(v.videoId)) { seen.add(v.videoId); result.push(v); }
        }
      }
    }

    // From user interests/categories — match against featured creators
    const interests = preferences?.interests ?? preferences?.preferredCategories ?? [];
    if (interests.length > 0) {
      const interestSet = new Set(interests.map((i) => i.toLowerCase()));
      for (const creator of FEATURED_CREATORS) {
        if (interestSet.has(creator.category.toLowerCase()) || interests.some((i) => creator.category.toLowerCase().includes(i.toLowerCase()))) {
          const videos = MOCK_CHANNEL_VIDEOS[creator.name] ?? [];
          for (const v of videos) {
            if (!seen.has(v.videoId)) { seen.add(v.videoId); result.push(v); }
          }
        }
      }
    }

    // If still empty, pull from all featured creators
    if (result.length === 0) {
      for (const creator of FEATURED_CREATORS.slice(0, 6)) {
        for (const v of (MOCK_CHANNEL_VIDEOS[creator.name] ?? [])) {
          if (!seen.has(v.videoId)) { seen.add(v.videoId); result.push(v); }
        }
      }
    }

    result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    return result;
  }, [subscriptions, preferences?.interests, preferences?.preferredCategories]);

  // Build a single mixed feed — interleave community + suggestions + refreshers
  const feedItems = useMemo(() => {
    const items: FeedEntry[] = [];
    const community = communitySummariesFiltered;
    const refreshers = [...summariesWithCards];
    let communityIdx = 0;
    let refresherIdx = 0;
    let sugIdx = 0;

    // Helper: push next community or suggestion
    const pushContent = () => {
      if (communityIdx < community.length) {
        items.push({ type: 'summary', data: community[communityIdx++] });
      } else if (sugIdx < suggestions.length) {
        items.push({ type: 'suggestion', data: suggestions[sugIdx++] });
      }
    };

    // First 2 items
    pushContent();
    pushContent();

    // Personalise card (if applicable)
    if (!hasPersonalised && !hasSubscriptions) {
      items.push({ type: 'personalise' });
    }

    // One refresher
    if (refresherIdx < refreshers.length) {
      items.push({ type: 'refresher', data: refreshers[refresherIdx++] });
    }

    // Fill remaining — alternate community/suggestions, refresher every 3
    let sinceRefresher = 0;
    const maxItems = 20;
    while (items.length < maxItems && (communityIdx < community.length || sugIdx < suggestions.length)) {
      pushContent();
      sinceRefresher++;

      if (sinceRefresher === 3 && refresherIdx < refreshers.length) {
        items.push({ type: 'refresher', data: refreshers[refresherIdx++] });
        sinceRefresher = 0;
      }
    }

    return items;
  }, [communitySummariesFiltered, summariesWithCards, suggestions, hasPersonalised, hasSubscriptions]);

  const handleImportYouTube = () => {
    importMutation.mutate(undefined, {
      onSuccess: (imported) => {
        showToast(`Imported ${imported.length} channels from YouTube`);
      },
      onError: () => {
        showToast('Failed to import channels');
      },
    });
  };

  if (isLoading && isCommunityLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable
          style={styles.addButton}
          onPress={() => router.push('/analyse')}
          accessibilityLabel="Analyse a new video"
          accessibilityRole="button">
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.appTitle}>YT Summarise</Text>
        <Pressable
          style={styles.bellButton}
          accessibilityLabel="Notifications"
          accessibilityRole="button">
          <Ionicons
            name="notifications-outline"
            size={22}
            color={Colors.text}
          />
        </Pressable>
      </View>

      {/* Due cards banner */}
      {dueCount > 0 && (
        <Pressable
          style={styles.dueBanner}
          onPress={() => router.push('/review')}>
          <View style={styles.dueBannerLeft}>
            <Ionicons name="time" size={20} color="#fff" />
            <Text style={styles.dueBannerText}>
              {dueCount} card{dueCount !== 1 ? 's' : ''} ready for review
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </Pressable>
      )}

      {/* Single mixed feed */}
      {feedItems.length > 0 ? (
        feedItems.map((item, index) => {
          if (item.type === 'summary') {
            return <VerticalVideoCard key={`s-${item.data.id}`} summary={item.data} />;
          }

          if (item.type === 'personalise') {
            return (
              <View key="personalise" style={styles.personaliseCard}>
                <View style={styles.personaliseIconRow}>
                  <View style={styles.personaliseIcon}>
                    <Ionicons name="sparkles" size={24} color={Colors.primary} />
                  </View>
                </View>
                <Text style={styles.personaliseTitle}>
                  Personalise your feed
                </Text>
                <Text style={styles.personaliseSubtitle}>
                  Your time is valuable, so let's curate what matters to you.
                </Text>
                <Pressable
                  style={styles.personaliseYouTubeBtn}
                  onPress={handleImportYouTube}
                  disabled={importMutation.isPending}
                  accessibilityLabel="Import subscribed channels from YouTube"
                  accessibilityRole="button">
                  {importMutation.isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="logo-youtube" size={18} color="#fff" />
                      <Text style={styles.personaliseYouTubeBtnText}>
                        Import Subscribed channels from YouTube
                      </Text>
                    </>
                  )}
                </Pressable>
                <Pressable
                  style={styles.personaliseManualBtn}
                  onPress={() => router.push('/personalise')}
                  accessibilityLabel="Manually personalise my feed"
                  accessibilityRole="button">
                  <Ionicons name="create-outline" size={18} color={Colors.primary} />
                  <Text style={styles.personaliseManualBtnText}>
                    Manually personalise my feed
                  </Text>
                </Pressable>
              </View>
            );
          }

          if (item.type === 'suggestion') {
            const video = item.data;
            // Alternate: every other suggestion uses a large card layout
            const sugCount = feedItems.slice(0, index).filter((i) => i.type === 'suggestion').length;
            const isLarge = sugCount % 3 === 0;
            return isLarge ? (
              <Pressable
                key={`sug-${video.videoId}`}
                style={styles.suggestionLargeCard}
                onPress={() => router.push({ pathname: '/confirm-analyse', params: { videoId: video.videoId, title: video.title, channelName: video.channelName, thumbnailUrl: video.thumbnailUrl, durationLabel: video.durationLabel ?? '' } })}
                accessibilityLabel={`Analyse ${video.title}`}
                accessibilityRole="button">
                <Image
                  source={{ uri: video.thumbnailUrl }}
                  style={styles.suggestionLargeThumb}
                  resizeMode="cover"
                />
                <View style={styles.suggestionLargeInfo}>
                  <View style={styles.suggestionLargeInfoRow}>
                    <View style={styles.suggestionLargeTextWrap}>
                      <Text style={styles.suggestionTitle} numberOfLines={2}>
                        {video.title}
                      </Text>
                      <Text style={styles.suggestionChannel} numberOfLines={1}>
                        {video.channelName}
                        {video.durationLabel ? ` · ${video.durationLabel}` : ''}
                      </Text>
                    </View>
                    <View style={styles.summariseTag}>
                      <Ionicons name="sparkles" size={12} color="#fff" />
                      <Text style={styles.summariseTagText}>Summarise</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ) : (
              <Pressable
                key={`sug-${video.videoId}`}
                style={styles.suggestionCard}
                onPress={() => router.push({ pathname: '/confirm-analyse', params: { videoId: video.videoId, title: video.title, channelName: video.channelName, thumbnailUrl: video.thumbnailUrl, durationLabel: video.durationLabel ?? '' } })}
                accessibilityLabel={`Analyse ${video.title}`}
                accessibilityRole="button">
                <Image
                  source={{ uri: video.thumbnailUrl }}
                  style={styles.suggestionThumb}
                  resizeMode="cover"
                />
                <View style={styles.suggestionInfo}>
                  <Text style={styles.suggestionTitle} numberOfLines={2}>
                    {video.title}
                  </Text>
                  <Text style={styles.suggestionChannel} numberOfLines={1}>
                    {video.channelName}
                    {video.durationLabel ? ` · ${video.durationLabel}` : ''}
                  </Text>
                </View>
                <View style={styles.summariseTag}>
                  <Ionicons name="sparkles" size={12} color="#fff" />
                  <Text style={styles.summariseTagText}>Summarise</Text>
                </View>
              </Pressable>
            );
          }

          if (item.type === 'refresher') {
            const s = item.data;
            const firstCard = s.refresherCards[0];
            const totalCards = s.refresherCards.length;
            return (
              <Pressable
                key={`r-${s.id}`}
                style={styles.inlineRefresher}
                onPress={() => router.push(`/refresher/${s.id}`)}
                accessibilityLabel={`Refresher cards for ${s.videoTitle}`}
                accessibilityRole="button">
                <View style={styles.inlineRefresherTop}>
                  <Image
                    source={{ uri: s.thumbnailUrl }}
                    style={styles.inlineRefresherThumb}
                    resizeMode="cover"
                  />
                  <View style={styles.inlineRefresherMeta}>
                    <Text style={styles.inlineRefresherVideoTitle} numberOfLines={2}>
                      {s.videoTitle}
                    </Text>
                  </View>
                </View>
                <Text style={styles.inlineRefresherQuestion} numberOfLines={2}>
                  {firstCard?.title ?? 'Review your knowledge'}
                </Text>
                <Text style={styles.inlineRefresherLink}>
                  View {totalCards > 1 ? `${totalCards - 1} others` : 'card'} from this video →
                </Text>
              </Pressable>
            );
          }

          return null;
        })
      ) : isCommunityLoading ? (
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
      ) : (
        <View style={styles.placeholder}>
          <Ionicons
            name="earth-outline"
            size={32}
            color={Colors.tabIconDefault}
          />
          <Text style={styles.placeholderText}>
            No community summaries yet. Be the first to share!
          </Text>
        </View>
      )}

      {/* Bottom padding */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 100,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  dueBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dueBannerText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  // Personalise card
  personaliseCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  personaliseIconRow: {
    marginBottom: 4,
  },
  personaliseIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  personaliseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  personaliseSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  personaliseYouTubeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    marginTop: 4,
  },
  personaliseYouTubeBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  personaliseManualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
  },
  personaliseManualBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  // Inline refresher card
  inlineRefresher: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 16,
  },
  inlineRefresherTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inlineRefresherThumb: {
    width: 60,
    height: 40,
    borderRadius: 6,
    backgroundColor: Colors.border,
  },
  inlineRefresherMeta: {
    flex: 1,
  },
  inlineRefresherVideoTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  inlineRefresherQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 20,
  },
  inlineRefresherLink: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  // Suggestion cards — large variant
  suggestionLargeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  suggestionLargeThumb: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.border,
  },
  suggestionLargeInfo: {
    padding: 14,
    gap: 4,
  },
  suggestionLargeInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  suggestionLargeTextWrap: {
    flex: 1,
    gap: 4,
  },
  // Suggestion cards — compact variant
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    marginBottom: 12,
  },
  suggestionThumb: {
    width: 100,
    height: 56,
    borderRadius: 8,
    backgroundColor: Colors.border,
  },
  suggestionInfo: {
    flex: 1,
    gap: 4,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
  },
  suggestionChannel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  summariseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  summariseTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  // Placeholders
  placeholder: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Community
  loader: {
    marginVertical: 20,
  },
});
