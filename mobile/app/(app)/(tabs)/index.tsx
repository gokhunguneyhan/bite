import {
  View,
  Text,
  Pressable,
  ScrollView,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
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
import { useToast } from '@/src/components/ui/Toast';
import { getChannelLatestVideos } from '@/src/services/youtubeImportService';
import { useTrendingVideos } from '@/src/hooks/useCategoryVideos';
import { FEATURED_CREATORS } from '@/src/constants/featuredCreators';
import { MOCK_CHANNEL_VIDEOS, type YouTubeVideo } from '@/src/mocks/youtubeSubscriptions';
import type { Summary, RefresherCard } from '@/src/types/summary';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CAROUSEL_CARD_WIDTH = SCREEN_WIDTH * 0.7;
const CAROUSEL_CARD_GAP = 12;

type FlatRefresherCard = RefresherCard & {
  summaryId: string;
  videoTitle: string;
  thumbnailUrl: string;
};

type SuggestedVideo = YouTubeVideo & {
  reason: string;
};

type CategoryCarouselItem =
  | { type: 'community'; data: Summary }
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

  const { data: trendingVideos, isLoading: isTrendingLoading } = useTrendingVideos();

  const dueCount = dueCards?.length ?? 0;
  const hasPersonalised = hasOnboarded === true;
  const hasSubscriptions = (subscriptions?.length ?? 0) > 0;
  const isNewUser = !hasPersonalised && !hasSubscriptions;

  // Top 6 community summaries for "From the community"
  const topCommunity = useMemo(
    () => (communitySummaries ?? []).slice(0, 6),
    [communitySummaries],
  );

  // All video suggestions with reason for why they're suggested
  const allSuggestions = useMemo(() => {
    const seen = new Set<string>();
    const result: SuggestedVideo[] = [];

    // From subscribed channels
    const subscribedNames = new Set((subscriptions ?? []).map((s) => s.channelName));
    if (subscriptions) {
      for (const sub of subscriptions) {
        for (const v of getChannelLatestVideos(sub.channelName)) {
          if (!seen.has(v.videoId)) {
            seen.add(v.videoId);
            result.push({ ...v, reason: sub.channelName });
          }
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
            if (!seen.has(v.videoId)) {
              seen.add(v.videoId);
              const reason = subscribedNames.has(v.channelName)
                ? v.channelName
                : creator.category;
              result.push({ ...v, reason });
            }
          }
        }
      }
    }

    // Fallback
    if (result.length === 0) {
      for (const creator of FEATURED_CREATORS.slice(0, 6)) {
        for (const v of (MOCK_CHANNEL_VIDEOS[creator.name] ?? [])) {
          if (!seen.has(v.videoId)) {
            seen.add(v.videoId);
            result.push({ ...v, reason: creator.category });
          }
        }
      }
    }

    result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    return result;
  }, [subscriptions, preferences?.interests, preferences?.preferredCategories]);

  // Category carousels: mix of community summaries + suggestions per user interest
  const categoryCarousels = useMemo(() => {
    const categories = preferences?.preferredCategories ?? preferences?.interests ?? [];
    if (categories.length === 0) return [];

    // Map category → creator names
    const creatorsByCategory: Record<string, Set<string>> = {};
    for (const creator of FEATURED_CREATORS) {
      const cat = creator.category.toLowerCase();
      if (!creatorsByCategory[cat]) creatorsByCategory[cat] = new Set();
      creatorsByCategory[cat].add(creator.name.toLowerCase());
    }

    return categories.map((cat) => {
      const catLower = cat.toLowerCase();
      const items: CategoryCarouselItem[] = [];
      const seenIds = new Set<string>();

      // Community summaries matching this category
      const matching = (communitySummaries ?? []).filter(
        (s) => s.category && s.category.toLowerCase() === catLower,
      );
      for (const s of matching.slice(0, 4)) {
        seenIds.add(s.videoId);
        items.push({ type: 'community', data: s });
      }

      // Suggestions from creators in this category
      const creatorNames = creatorsByCategory[catLower] ?? new Set();
      for (const sug of allSuggestions) {
        if (items.length >= 8) break;
        if (seenIds.has(sug.videoId)) continue;
        if (creatorNames.has(sug.channelName.toLowerCase())) {
          seenIds.add(sug.videoId);
          items.push({ type: 'suggestion', data: sug });
        }
      }

      return { category: cat, items };
    }).filter((c) => c.items.length > 0);
  }, [preferences?.preferredCategories, preferences?.interests, communitySummaries, allSuggestions]);

  // Flat refresher cards — individual cards with source video info
  const flatRefresherCards = useMemo(() => {
    const cards: FlatRefresherCard[] = [];
    for (const s of summaries ?? []) {
      for (const card of s.refresherCards ?? []) {
        cards.push({
          ...card,
          summaryId: s.id,
          videoTitle: s.videoTitle,
          thumbnailUrl: s.thumbnailUrl,
        });
      }
    }
    return cards;
  }, [summaries]);

  // Suggested videos — those not already shown in category carousels
  const suggestedVideos = useMemo(() => {
    const usedIds = new Set<string>();
    for (const c of categoryCarousels) {
      for (const item of c.items) {
        if (item.type === 'suggestion') usedIds.add(item.data.videoId);
      }
    }
    return allSuggestions.filter((v) => !usedIds.has(v.videoId));
  }, [allSuggestions, categoryCarousels]);

  // State for single refresher card modal
  const [selectedCard, setSelectedCard] = useState<FlatRefresherCard | null>(null);

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
        <Text style={styles.appTitle}>Bite</Text>
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

      {/* 1. Personalise card */}
      {!hasPersonalised && !hasSubscriptions && (
        <View style={styles.personaliseCard}>
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
      )}

      {/* 2. From the community carousel */}
      {topCommunity.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>From the community</Text>
          <FlatList
            data={topCommunity}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
            renderItem={({ item }) => (
              <Pressable
                style={styles.communityCard}
                onPress={() => router.push(`/summary/${item.id}`)}>
                <Image
                  source={{ uri: item.thumbnailUrl }}
                  style={styles.communityThumb}
                  contentFit="cover"
                />
                <View style={styles.communityInfo}>
                  <Text style={styles.communityTitle} numberOfLines={2}>
                    {item.videoTitle}
                  </Text>
                  <Text style={styles.communityMeta} numberOfLines={1}>
                    {item.channelName}
                  </Text>
                  {item.category && item.category !== 'Other' && (
                    <View style={styles.chipRow}>
                      <View style={styles.categoryChip}>
                        <Text style={styles.categoryChipText}>{item.category}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </Pressable>
            )}
          />
        </View>
      )}
      {isCommunityLoading && topCommunity.length === 0 && (
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
      )}

      {/* 3. Category carousels */}
      {categoryCarousels.map((carousel) => (
        <View key={carousel.category} style={styles.section}>
          <Text style={styles.sectionTitle}>{carousel.category}</Text>
          <FlatList
            data={carousel.items}
            keyExtractor={(item, i) =>
              item.type === 'community' ? `c-${item.data.id}` : `s-${item.data.videoId}-${i}`
            }
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
            renderItem={({ item }) => {
              if (item.type === 'community') {
                const s = item.data;
                return (
                  <Pressable
                    style={styles.communityCard}
                    onPress={() => router.push(`/summary/${s.id}`)}>
                    <Image
                      source={{ uri: s.thumbnailUrl }}
                      style={styles.communityThumb}
                      contentFit="cover"
                    />
                    <View style={styles.communityInfo}>
                      <Text style={styles.communityTitle} numberOfLines={2}>
                        {s.videoTitle}
                      </Text>
                      <Text style={styles.communityMeta} numberOfLines={1}>
                        {s.channelName}
                      </Text>
                    </View>
                  </Pressable>
                );
              }
              const video = item.data;
              return (
                <Pressable
                  style={styles.suggestionCarouselCard}
                  onPress={() => router.push({ pathname: '/confirm-analyse', params: { videoId: video.videoId, title: video.title, channelName: video.channelName, thumbnailUrl: video.thumbnailUrl, durationLabel: video.durationLabel ?? '' } })}>
                  <Image
                    source={{ uri: video.thumbnailUrl }}
                    style={styles.communityThumb}
                    contentFit="cover"
                  />
                  <View style={styles.communityInfo}>
                    <Text style={styles.communityTitle} numberOfLines={2}>
                      {video.title}
                    </Text>
                    <View style={styles.suggestionMetaRow}>
                      <Text style={styles.communityMeta} numberOfLines={1}>
                        {video.channelName}
                        {video.durationLabel ? ` · ${video.durationLabel}` : ''}
                      </Text>
                    </View>
                    <View style={styles.summariseTag}>
                      <Ionicons name="sparkles" size={10} color="#fff" />
                      <Text style={styles.summariseTagText}>Summarise</Text>
                    </View>
                  </View>
                </Pressable>
              );
            }}
          />
        </View>
      ))}

      {/* 4. Refresher cards carousel */}
      {flatRefresherCards.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Refresher cards</Text>
          <FlatList
            data={flatRefresherCards}
            keyExtractor={(item) => `${item.summaryId}-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
            renderItem={({ item }) => (
              <Pressable
                style={styles.refresherCard}
                onPress={() => setSelectedCard(item)}
                accessibilityLabel={`Refresher: ${item.title}`}
                accessibilityRole="button">
                <View style={styles.refresherSourceRow}>
                  <Image
                    source={{ uri: item.thumbnailUrl }}
                    style={styles.refresherSourceThumb}
                    contentFit="cover"
                  />
                  <Text style={styles.refresherSourceTitle} numberOfLines={1}>
                    {item.videoTitle}
                  </Text>
                </View>
                <Text style={styles.refresherQuestion} numberOfLines={3}>
                  {item.title}
                </Text>
                <Text style={styles.refresherHint} numberOfLines={2}>
                  {item.explanation}
                </Text>
              </Pressable>
            )}
          />
        </View>
      )}

      {/* 5. Trending (new users) or Suggested for you (personalised users) */}
      {isNewUser ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trending</Text>
          <Text style={styles.trendingSubtitle}>
            Suggested videos from popular categories & channels
          </Text>
          {isTrendingLoading && (
            <ActivityIndicator color={Colors.primary} style={styles.loader} />
          )}
          {(trendingVideos ?? []).map((video) => (
            <Pressable
              key={video.videoId}
              style={styles.suggestedCard}
              onPress={() => router.push({ pathname: '/confirm-analyse', params: { videoId: video.videoId, title: video.title, channelName: video.channelName, thumbnailUrl: video.thumbnailUrl, durationLabel: video.durationLabel ?? '' } })}
              accessibilityLabel={`Analyse ${video.title}`}
              accessibilityRole="button">
              <Image
                source={{ uri: video.thumbnailUrl }}
                style={styles.suggestedCardThumb}
                contentFit="cover"
              />
              <View style={styles.suggestedCardInfo}>
                <Text style={styles.suggestedCardTitle}>
                  {video.title}
                </Text>
                <View style={styles.suggestedCardMeta}>
                  <Text style={styles.suggestedCardChannel}>
                    {video.channelName}
                    {video.durationLabel ? ` · ${video.durationLabel}` : ''}
                  </Text>
                  <View style={styles.summariseTagSmall}>
                    <Ionicons name="sparkles" size={10} color="#fff" />
                    <Text style={styles.summariseTagText}>Summarise</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      ) : suggestedVideos.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suggested for you</Text>
          {suggestedVideos.map((video) => {
            const isChannel = (subscriptions ?? []).some(
              (s) => s.channelName === video.reason,
            );
            return (
              <Pressable
                key={video.videoId}
                style={styles.suggestedCard}
                onPress={() => router.push({ pathname: '/confirm-analyse', params: { videoId: video.videoId, title: video.title, channelName: video.channelName, thumbnailUrl: video.thumbnailUrl, durationLabel: video.durationLabel ?? '' } })}
                accessibilityLabel={`Analyse ${video.title}`}
                accessibilityRole="button">
                <View style={styles.suggestedReasonRow}>
                  <Ionicons
                    name={isChannel ? 'person-circle-outline' : 'compass-outline'}
                    size={14}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.suggestedReasonText}>
                    {video.reason}
                  </Text>
                </View>
                <Image
                  source={{ uri: video.thumbnailUrl }}
                  style={styles.suggestedCardThumb}
                  contentFit="cover"
                />
                <View style={styles.suggestedCardInfo}>
                  <Text style={styles.suggestedCardTitle}>
                    {video.title}
                  </Text>
                  <View style={styles.suggestedCardMeta}>
                    <Text style={styles.suggestedCardChannel}>
                      {video.channelName}
                      {video.durationLabel ? ` · ${video.durationLabel}` : ''}
                    </Text>
                    <View style={styles.summariseTagSmall}>
                      <Ionicons name="sparkles" size={10} color="#fff" />
                      <Text style={styles.summariseTagText}>Summarise</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {/* Empty state */}
      {topCommunity.length === 0 && !isCommunityLoading && suggestedVideos.length === 0 && categoryCarousels.length === 0 && (
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

      {/* Single refresher card modal */}
      <Modal
        visible={selectedCard !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedCard(null)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedCard(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Pressable
              style={styles.modalCloseBtn}
              onPress={() => setSelectedCard(null)}
              accessibilityLabel="Close"
              accessibilityRole="button">
              <Ionicons name="close" size={22} color={Colors.text} />
            </Pressable>
            {selectedCard && (
              <ScrollView
                style={styles.modalScrollContent}
                contentContainerStyle={styles.modalInner}
                showsVerticalScrollIndicator={false}>
                <View style={styles.modalSourceRow}>
                  <Image
                    source={{ uri: selectedCard.thumbnailUrl }}
                    style={styles.modalSourceThumb}
                    contentFit="cover"
                  />
                  <Text style={styles.modalSourceTitle} numberOfLines={2}>
                    {selectedCard.videoTitle}
                  </Text>
                </View>
                <Text style={styles.modalQuestion}>{selectedCard.title}</Text>
                <Text style={styles.modalExplanation}>
                  {selectedCard.explanation}
                </Text>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
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
    paddingHorizontal: 24,
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
    marginHorizontal: 24,
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
    marginBottom: 8,
    marginHorizontal: 24,
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
  // Section
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  trendingSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    paddingHorizontal: 24,
    marginTop: -4,
    marginBottom: 12,
    lineHeight: 18,
  },
  // Carousel shared
  carouselContent: {
    paddingHorizontal: 24,
    gap: CAROUSEL_CARD_GAP,
  },
  // Community / category carousel card
  communityCard: {
    width: CAROUSEL_CARD_WIDTH,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  communityThumb: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.border,
  },
  communityInfo: {
    padding: 10,
    gap: 4,
  },
  communityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
  },
  communityMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  chipRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  categoryChip: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  // Suggestion card inside category carousel
  suggestionCarouselCard: {
    width: CAROUSEL_CARD_WIDTH,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  suggestionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summariseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  summariseTagSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  summariseTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  // Refresher carousel card
  refresherCard: {
    width: CAROUSEL_CARD_WIDTH,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  refresherSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refresherSourceThumb: {
    width: 44,
    height: 28,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  refresherSourceTitle: {
    flex: 1,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 14,
  },
  refresherQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 20,
  },
  refresherHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  // Suggested videos — vertical cards
  suggestedCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 24,
    marginBottom: 16,
  },
  suggestedReasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  suggestedReasonText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  suggestedCardThumb: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.border,
  },
  suggestedCardInfo: {
    padding: 12,
    gap: 8,
  },
  suggestedCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 20,
  },
  suggestedCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  suggestedCardChannel: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  // Modal for single refresher card
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    width: '100%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollContent: {
    borderRadius: 20,
  },
  modalInner: {
    padding: 24,
    paddingTop: 20,
    gap: 16,
  },
  modalSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 36,
  },
  modalSourceThumb: {
    width: 56,
    height: 36,
    borderRadius: 6,
    backgroundColor: Colors.border,
  },
  modalSourceTitle: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  modalQuestion: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 28,
  },
  modalExplanation: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 26,
  },
  // Placeholders
  placeholder: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 24,
    marginTop: 20,
  },
  placeholderText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  loader: {
    marginVertical: 20,
  },
});
