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
} from '@/src/hooks/useSummary';
import { usePreferences, useOnboardingStatus } from '@/src/hooks/usePreferences';
import { useDueCards } from '@/src/hooks/useSpacedRepetition';
import { VerticalVideoCard } from '@/src/components/summary/VerticalVideoCard';
import { useToast } from '@/src/components/ui/Toast';

export default function HomeScreen() {
  const { data: summaries, isLoading } = useSummaries();
  const { data: communitySummaries, isLoading: isCommunityLoading } =
    useCommunitySummaries();
  const { data: preferences } = usePreferences();
  const { data: subscriptions } = useSubscriptions();
  const { data: dueCards } = useDueCards();
  const { data: hasOnboarded } = useOnboardingStatus();
  const showToast = useToast();

  const dueCount = dueCards?.length ?? 0;

  // Summaries that have refresher cards
  const summariesWithCards = useMemo(
    () => summaries?.filter((s) => s.refresherCards?.length > 0) ?? [],
    [summaries],
  );

  // Community summaries from followed channels
  const channelSummaries = useMemo(() => {
    if (!communitySummaries || !subscriptions?.length) return [];
    const followed = subscriptions.map((s) => s.channelName.toLowerCase());
    return communitySummaries.filter((s) =>
      followed.includes(s.channelName.toLowerCase()),
    );
  }, [communitySummaries, subscriptions]);

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

  const showPersonalisePrompt = hasOnboarded === false;

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

      {/* TODO: Continue Reading section — track lastReadPosition per summary */}

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

      {/* New from Followed Channels */}
      {subscriptions && subscriptions.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>New from Followed Channels</Text>
          {channelSummaries.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
              contentContainerStyle={styles.horizontalContent}>
              {channelSummaries.slice(0, 10).map((s) => (
                <Pressable
                  key={s.id}
                  style={styles.channelCard}
                  onPress={() => router.push(`/summary/${s.id}`)}
                  accessibilityRole="button">
                  <Image
                    source={{ uri: s.thumbnailUrl }}
                    style={styles.channelCardThumb}
                    resizeMode="cover"
                  />
                  <View style={styles.channelCardInfo}>
                    <Text style={styles.channelCardTitle} numberOfLines={2}>
                      {s.videoTitle}
                    </Text>
                    <Text style={styles.channelCardChannel}>
                      {s.channelName}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.placeholder}>
              <Ionicons
                name="videocam-outline"
                size={32}
                color={Colors.tabIconDefault}
              />
              <Text style={styles.placeholderText}>
                No new videos from your followed channels yet.
              </Text>
            </View>
          )}
        </>
      )}

      {!subscriptions?.length && (
        <>
          <Text style={styles.sectionTitle}>Followed Channels</Text>
          <View style={styles.placeholder}>
            <Ionicons
              name="people-outline"
              size={32}
              color={Colors.tabIconDefault}
            />
            <Text style={styles.placeholderText}>
              Follow channels to see new videos here.
            </Text>
          </View>
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

      {/* Personalisation prompt */}
      {showPersonalisePrompt && (
        <View style={styles.personaliseCard}>
          <Ionicons name="sparkles" size={24} color={Colors.primary} />
          <Text style={styles.personaliseText}>
            Pick your interests and follow YouTube channels to personalise your
            feed.
          </Text>
          <View style={styles.personaliseActions}>
            <Pressable
              style={styles.personaliseButton}
              onPress={() => {
                // TODO: Navigate to PersonalizeScreen when it becomes a route
                showToast('Coming soon');
              }}
              accessibilityLabel="Personalise feed"
              accessibilityRole="button">
              <Text style={styles.personaliseButtonText}>Personalise</Text>
            </Pressable>
            <Pressable
              onPress={() => showToast('Coming soon')}
              accessibilityLabel="Import from YouTube"
              accessibilityRole="button">
              <Text style={styles.personaliseSecondary}>
                Import from YouTube
              </Text>
            </Pressable>
          </View>
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
  // Refresher cards horizontal scroll
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
  // Channel cards
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
  // Personalisation prompt
  personaliseCard: {
    backgroundColor: Colors.primary + '08',
    borderWidth: 1,
    borderColor: Colors.primary + '20',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  personaliseText: {
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  personaliseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  personaliseButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  personaliseButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  personaliseSecondary: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
