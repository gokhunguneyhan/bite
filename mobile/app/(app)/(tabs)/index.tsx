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
import type { YouTubeVideo } from '@/src/mocks/youtubeSubscriptions';
import type { Summary } from '@/src/types/summary';

type FeedEntry =
  | { type: 'summary'; data: Summary }
  | { type: 'personalise' }
  | { type: 'refresher'; data: Summary }
  | { type: 'suggestion'; data: YouTubeVideo };

export default function HomeScreen() {
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

  // Build a single mixed feed
  const feedItems = useMemo(() => {
    const items: FeedEntry[] = [];
    const community = communitySummariesFiltered;
    const refreshers = [...summariesWithCards];
    let communityIdx = 0;
    let refresherIdx = 0;

    // 1. First 2 community summaries
    while (communityIdx < 2 && communityIdx < community.length) {
      items.push({ type: 'summary', data: community[communityIdx] });
      communityIdx++;
    }

    // 2. Personalise card (if applicable)
    if (!hasPersonalised && !hasSubscriptions) {
      items.push({ type: 'personalise' });
    }

    // 3. One inline refresher card (if any)
    if (refresherIdx < refreshers.length) {
      items.push({ type: 'refresher', data: refreshers[refresherIdx] });
      refresherIdx++;
    }

    // 4. Remaining community summaries interleaved with refreshers (1 every 3)
    let sinceLastRefresher = 0;
    while (communityIdx < community.length) {
      items.push({ type: 'summary', data: community[communityIdx] });
      communityIdx++;
      sinceLastRefresher++;

      if (sinceLastRefresher === 3 && refresherIdx < refreshers.length) {
        items.push({ type: 'refresher', data: refreshers[refresherIdx] });
        refresherIdx++;
        sinceLastRefresher = 0;
      }
    }

    // 5. If feed is sparse and user has subscriptions, add video suggestions
    if (items.filter((i) => i.type === 'summary').length < 4 && hasSubscriptions && subscriptions) {
      const seen = new Set<string>();
      const suggestions: YouTubeVideo[] = [];
      for (const sub of subscriptions) {
        const videos = getChannelLatestVideos(sub.channelName);
        for (const v of videos) {
          if (!seen.has(v.videoId)) {
            seen.add(v.videoId);
            suggestions.push(v);
          }
        }
      }
      // Sort by date, take up to 8
      suggestions.sort((a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );
      for (const s of suggestions.slice(0, 8)) {
        items.push({ type: 'suggestion', data: s });
      }
    }

    return items;
  }, [communitySummariesFiltered, summariesWithCards, hasPersonalised, hasSubscriptions, subscriptions]);

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
      style={styles.container}
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
            const isFirst = index === 0 || feedItems[index - 1]?.type !== 'suggestion';
            return (
              <View key={`sug-${video.videoId}`}>
                {isFirst && (
                  <Text style={styles.suggestionHeader}>Suggested for you</Text>
                )}
              <Pressable
                key={`sug-${video.videoId}`}
                style={styles.suggestionCard}
                onPress={() => router.push({ pathname: '/analyse', params: { url: `https://youtube.com/watch?v=${video.videoId}` } })}
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
                <View style={styles.analyseTag}>
                  <Ionicons name="sparkles" size={12} color="#fff" />
                  <Text style={styles.analyseTagText}>Analyse</Text>
                </View>
              </Pressable>
              </View>
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
  // Suggestion cards
  suggestionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 8,
    marginBottom: 12,
  },
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
  analyseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  analyseTagText: {
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
