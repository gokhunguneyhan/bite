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
import { useYouTubeStore } from '@/src/stores/youtubeStore';
import type { Summary } from '@/src/types/summary';
import type { YouTubeVideo } from '@/src/mocks/youtubeSubscriptions';

type FeedItem =
  | { type: 'summary'; data: Summary; date: string }
  | { type: 'video'; data: YouTubeVideo; date: string };

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
  const channelVideos = useYouTubeStore((s) => s.channelVideos);

  const dueCount = dueCards?.length ?? 0;
  const hasPersonalised = hasOnboarded === true;
  const hasSubscriptions = (subscriptions?.length ?? 0) > 0;

  // Summaries that have refresher cards
  const summariesWithCards = useMemo(
    () => summaries?.filter((s) => s.refresherCards?.length > 0) ?? [],
    [summaries],
  );

  // Analysed summaries from followed channels
  const channelSummaries = useMemo(() => {
    if (!communitySummaries || !subscriptions?.length) return [];
    const followed = subscriptions.map((s) => s.channelName.toLowerCase());
    return communitySummaries.filter((s) =>
      followed.includes(s.channelName.toLowerCase()),
    );
  }, [communitySummaries, subscriptions]);

  // Build a mixed feed: analysed summaries + latest unanalysed videos
  const followedFeedItems = useMemo(() => {
    const items: FeedItem[] = [];

    // Add analysed summaries
    for (const s of channelSummaries) {
      items.push({ type: 'summary', data: s, date: s.createdAt });
    }

    // Add unanalysed latest videos from YouTube store
    const analysedVideoIds = new Set(
      channelSummaries.map((s) => s.videoId),
    );

    if (subscriptions) {
      for (const sub of subscriptions) {
        const videos = channelVideos[sub.channelName] ?? [];
        for (const v of videos) {
          if (!analysedVideoIds.has(v.videoId)) {
            items.push({ type: 'video', data: v, date: v.publishedAt });
          }
        }
      }
    }

    // Sort by date, newest first
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items.slice(0, 15);
  }, [channelSummaries, subscriptions, channelVideos]);

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

      {/* Your Refresher Cards */}
      <Text style={styles.sectionTitle}>Your Refresher Cards</Text>
      {summariesWithCards.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalScroll}
          contentContainerStyle={styles.horizontalContent}>
          {summariesWithCards.map((s) => (
            <Pressable
              key={s.id}
              style={styles.refresherCard}
              onPress={() => router.push(`/refresher/${s.id}`)}
              accessibilityLabel={`${s.videoTitle} — ${s.refresherCards.length} cards`}
              accessibilityRole="button">
              <Image
                source={{ uri: s.thumbnailUrl }}
                style={styles.refresherThumb}
                resizeMode="cover"
              />
              <View style={styles.refresherInfo}>
                <Text style={styles.refresherTitle} numberOfLines={2}>
                  {s.videoTitle}
                </Text>
                <View style={styles.refresherBadge}>
                  <Ionicons
                    name="albums-outline"
                    size={12}
                    color={Colors.primary}
                  />
                  <Text style={styles.refresherCount}>
                    {s.refresherCards.length} cards
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.placeholder}>
          <Ionicons
            name="albums-outline"
            size={32}
            color={Colors.tabIconDefault}
          />
          <Text style={styles.placeholderText}>
            Your reminder cards will appear here when you start summarising.
          </Text>
        </View>
      )}

      {/* Personalise your feed — shown when user hasn't picked interests */}
      {!hasPersonalised && !hasSubscriptions && (
        <>
          <Text style={styles.sectionTitle}>Customise Your Feed</Text>
          <View style={styles.onboardingCard}>
            <View style={styles.onboardingIconRow}>
              <View style={styles.onboardingIcon}>
                <Ionicons name="sparkles" size={24} color={Colors.primary} />
              </View>
            </View>
            <Text style={styles.onboardingTitle}>
              Pick your goals & interests to{'\n'}customise your feed
            </Text>
            <Text style={styles.onboardingSubtitle}>
              We'll show you summaries and channels that match what you care
              about.
            </Text>
            <Pressable
              style={styles.onboardingPrimaryBtn}
              onPress={() => router.push('/personalise')}
              accessibilityLabel="Personalise my feed"
              accessibilityRole="button">
              <Ionicons name="color-wand-outline" size={18} color="#fff" />
              <Text style={styles.onboardingPrimaryText}>
                Personalise my feed
              </Text>
            </Pressable>
            <Pressable
              style={styles.onboardingSecondaryBtn}
              onPress={handleImportYouTube}
              disabled={importMutation.isPending}
              accessibilityLabel="Import subscribed channels from YouTube"
              accessibilityRole="button">
              {importMutation.isPending ? (
                <ActivityIndicator color={Colors.primary} size="small" />
              ) : (
                <>
                  <Ionicons name="logo-youtube" size={18} color={Colors.primary} />
                  <Text style={styles.onboardingSecondaryText}>
                    Import subscribed channels from YouTube
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </>
      )}

      {/* New from Followed Channels — shows analysed + latest unanalysed videos */}
      {hasSubscriptions && (
        <>
          <Text style={styles.sectionTitle}>New from Followed Channels</Text>
          {followedFeedItems.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
              contentContainerStyle={styles.horizontalContent}>
              {followedFeedItems.map((item) =>
                item.type === 'summary' ? (
                  <Pressable
                    key={`s-${item.data.id}`}
                    style={styles.channelCard}
                    onPress={() => router.push(`/summary/${item.data.id}`)}
                    accessibilityRole="button">
                    <Image
                      source={{ uri: item.data.thumbnailUrl }}
                      style={styles.channelCardThumb}
                      resizeMode="cover"
                    />
                    <View style={styles.channelCardInfo}>
                      <Text style={styles.channelCardTitle} numberOfLines={2}>
                        {item.data.videoTitle}
                      </Text>
                      <Text style={styles.channelCardChannel}>
                        {item.data.channelName}
                      </Text>
                    </View>
                  </Pressable>
                ) : (
                  <Pressable
                    key={`v-${item.data.videoId}`}
                    style={styles.videoCard}
                    onPress={() =>
                      router.push({
                        pathname: '/analyse',
                        params: {
                          url: `https://youtube.com/watch?v=${item.data.videoId}`,
                        },
                      })
                    }
                    accessibilityLabel={`Analyse ${item.data.title}`}
                    accessibilityRole="button">
                    <Image
                      source={{ uri: item.data.thumbnailUrl }}
                      style={styles.channelCardThumb}
                      resizeMode="cover"
                    />
                    {item.data.durationLabel ? (
                      <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>
                          {item.data.durationLabel}
                        </Text>
                      </View>
                    ) : null}
                    <View style={styles.channelCardInfo}>
                      <Text style={styles.channelCardTitle} numberOfLines={2}>
                        {item.data.title}
                      </Text>
                      <Text style={styles.channelCardChannel}>
                        {item.data.channelName}
                      </Text>
                      <View style={styles.analyseTag}>
                        <Ionicons
                          name="sparkles-outline"
                          size={12}
                          color={Colors.primary}
                        />
                        <Text style={styles.analyseTagText}>Analyse</Text>
                      </View>
                    </View>
                  </Pressable>
                ),
              )}
            </ScrollView>
          ) : (
            <View style={styles.placeholder}>
              <Ionicons
                name="videocam-outline"
                size={32}
                color={Colors.tabIconDefault}
              />
              <Text style={styles.placeholderText}>
                No videos from your followed channels yet. Tap a channel to
                browse their latest videos.
              </Text>
            </View>
          )}
        </>
      )}

      {/* From the Community */}
      <Text style={styles.sectionTitle}>From the Community</Text>
      {communitySummariesFiltered.length > 0 ? (
        communitySummariesFiltered
          .slice(0, 10)
          .map((s) => <VerticalVideoCard key={s.id} summary={s} />)
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  // Horizontal scrolls
  horizontalScroll: {
    marginHorizontal: -24,
    marginBottom: 16,
  },
  horizontalContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  refresherCard: {
    width: 200,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  refresherThumb: {
    width: '100%',
    height: 112,
    backgroundColor: Colors.border,
  },
  refresherInfo: {
    padding: 10,
    gap: 6,
  },
  refresherTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
  },
  refresherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refresherCount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  // Channel + video cards
  channelCard: {
    width: 220,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  channelCardThumb: {
    width: '100%',
    height: 124,
    backgroundColor: Colors.border,
  },
  channelCardInfo: {
    padding: 10,
    gap: 4,
  },
  channelCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 19,
  },
  channelCardChannel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  videoCard: {
    width: 220,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  durationBadge: {
    position: 'absolute',
    top: 100,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  analyseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  analyseTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
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
  // Onboarding card
  onboardingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  onboardingIconRow: {
    marginBottom: 4,
  },
  onboardingIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onboardingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  onboardingSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  onboardingPrimaryBtn: {
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
  onboardingPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  onboardingSecondaryBtn: {
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
  onboardingSecondaryText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  // Community
  loader: {
    marginVertical: 20,
  },
});
