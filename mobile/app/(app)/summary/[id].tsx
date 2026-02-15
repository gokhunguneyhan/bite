import { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,

  Share,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import {
  useSummary,
  useCachedTranslation,
  useTranslateSummary,
  useTogglePublish,
  useIsSubscribed,
  useSubscribe,
  useUnsubscribe,
  useCommunitySummaries,
} from '@/src/hooks/useSummary';
import { useSession } from '@/src/providers/SessionProvider';
import { useSettingsStore, LANGUAGES } from '@/src/stores/settingsStore';
import { useLikeStore } from '@/src/stores/likeStore';
import { useBookmarkStore } from '@/src/stores/bookmarkStore';
import { CommunityShareCallout } from '@/src/components/summary/CommunityShareCallout';
import { SectionActions } from '@/src/components/summary/SectionActions';
import { SectionNavigator } from '@/src/components/summary/SectionNavigator';
import type { SectionKey } from '@/src/components/summary/SectionNavigator';

import { useToast } from '@/src/components/ui/Toast';
import { useTTS } from '@/src/hooks/useTTS';
import { useOfflineStore } from '@/src/stores/offlineStore';
import { useRevenueCat } from '@/src/providers/RevenueCatProvider';
import MiniYouTubePlayer, { PLAYER_HEIGHT } from '@/src/components/summary/MiniYouTubePlayer';
import { useChannelInfo, useChannelVideos } from '@/src/hooks/useChannelInfo';
import { useIsAdmin, useEditorsPickIds, useToggleEditorsPick } from '@/src/hooks/useEditorsPicks';
import { SUMMARIZE } from '@/src/utils/locale';
import type { Summary } from '@/src/types/summary';
import type { YouTubeVideo } from '@/src/mocks/youtubeSubscriptions';

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getReadingTime(sections: { content: string }[]): string {
  const words = sections.reduce(
    (sum, s) => sum + s.content.split(/\s+/).length,
    0,
  );
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

const RESOURCE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  book: 'book',
  course: 'school-outline',
  tool: 'construct-outline',
  website: 'globe-outline',
  podcast: 'mic-outline',
};

function getResourceIcon(type: string): keyof typeof Ionicons.glyphMap {
  return RESOURCE_ICONS[type] || 'link';
}

type MoreItem =
  | { type: 'summary'; data: Summary }
  | { type: 'video'; data: YouTubeVideo };

function getRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return new Date(dateString).toLocaleDateString();
}

export default function SummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: summary, isLoading, error } = useSummary(id);
  const { data: communitySummaries } = useCommunitySummaries();
  const { user } = useSession();
  const language = useSettingsStore((s) => s.language);
  const translateMutation = useTranslateSummary();
  const togglePublishMutation = useTogglePublish();
  const [showOriginal, setShowOriginal] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>('intro');
  // isAnonymous is local state for now -- TODO: persist to Supabase
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Inline YouTube player
  const [inlinePlayer, setInlinePlayer] = useState<{
    videoId: string;
    startSeconds: number;
    sectionTitle: string;
  } | null>(null);

  const { isPro } = useRevenueCat();
  const showToast = useToast();

  // Channel info (avatar, channelId) & more videos
  const { data: channelInfo } = useChannelInfo(summary?.channelName);
  const { data: channelVideos } = useChannelVideos(channelInfo?.channelId);

  // Editor's picks
  const { data: isAdmin } = useIsAdmin();
  const { data: editorsPickIds } = useEditorsPickIds();
  const togglePickMutation = useToggleEditorsPick();
  const isEditorsPick = (editorsPickIds ?? []).includes(id);

  // Offline
  const isOfflineCached = useOfflineStore((s) => s.isCached(id));

  // Like store
  const isLiked = useLikeStore((s) => s.isLiked(id));
  const toggleLike = useLikeStore((s) => s.toggleLike);

  // Bookmark store (sectionIndex -1 = whole summary)
  const isSaved = useBookmarkStore((s) => s.isBookmarked(id, -1));
  const addBookmark = useBookmarkStore((s) => s.addBookmark);
  const removeBookmark = useBookmarkStore((s) => s.removeBookmark);

  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<string, number>>({});

  // Scroll direction tracking — show nav after scrolling up ~15% of viewport
  const [showSectionNav, setShowSectionNav] = useState(true);
  const lastScrollY = useRef(0);
  const scrollDirectionAnchor = useRef(0);
  const wasScrollingDown = useRef(false);

  const channelForSub = summary?.channelName ?? '';
  const { data: subscribed } = useIsSubscribed(channelForSub);
  const subscribeMutation = useSubscribe();
  const unsubscribeMutation = useUnsubscribe();
  const isFollowing = subscribed === true;
  const isSubMutating =
    subscribeMutation.isPending || unsubscribeMutation.isPending;

  const isOwner = summary && user && summary.userId === user.id;

  const needsTranslation = summary
    ? summary.originalLanguage !== language
    : false;

  const { data: cachedTranslation, isLoading: isCheckingCache } =
    useCachedTranslation(summary?.id, language, needsTranslation);

  const translatedContent =
    cachedTranslation ||
    (translateMutation.isSuccess ? translateMutation.data : null);
  const translationAvailable = translatedContent != null;

  const langLabel =
    LANGUAGES.find((l) => l.code === language)?.label || language;

  const displaySummary = useMemo((): Summary | null => {
    if (!summary) return null;
    if (!needsTranslation || showOriginal || !translatedContent) return summary;

    const t = translatedContent as Record<string, any>;
    return {
      ...summary,
      quickSummary: t.quickSummary ?? summary.quickSummary,
      contextualSections: t.contextualSections
        ? summary.contextualSections.map((s, i) => ({
            ...s,
            ...(t.contextualSections[i] ?? {}),
          }))
        : summary.contextualSections,
      refresherCards: t.refresherCards
        ? summary.refresherCards.map((c, i) => ({
            ...c,
            ...(t.refresherCards[i] ?? {}),
          }))
        : summary.refresherCards,
      actionableInsights:
        t.actionableInsights ?? summary.actionableInsights,
      affiliateLinks: t.affiliateLinks
        ? summary.affiliateLinks.map((l, i) => ({
            ...l,
            ...(t.affiliateLinks[i] ?? {}),
          }))
        : summary.affiliateLinks,
      language,
    };
  }, [summary, needsTranslation, showOriginal, translatedContent, language]);

  // TTS (must be after displaySummary)
  const tts = useTTS({ summary: displaySummary, language, isPro });

  const handleTranslate = () => {
    translateMutation.mutate(
      { summaryId: id, targetLanguage: language },
      {
        onError: (err: Error) => {
          Alert.alert('Translation failed', err.message);
        },
      },
    );
  };

  const handleSummaryShare = async () => {
    if (!summary) return;
    await Share.share({
      message: `Check out this analysis of "${summary.videoTitle}" by ${summary.channelName}\n\nhttps://youtube.com/watch?v=${summary.videoId}`,
    });
  };

  const handleSave = () => {
    if (!summary) return;
    if (isSaved) {
      removeBookmark(id, -1);
      showToast('Removed from saved');
    } else {
      addBookmark({
        summaryId: id,
        sectionIndex: -1,
        sectionTitle: summary.videoTitle,
        sectionContent: summary.quickSummary.slice(0, 200),
        videoTitle: summary.videoTitle,
        channelName: summary.channelName,
      });
      showToast('Saved');
    }
  };

  const handleReport = () => {
    showToast('Report submitted');
  };

  const handleToggleFollow = () => {
    if (!summary || isSubMutating) return;
    if (isFollowing) {
      unsubscribeMutation.mutate(summary.channelName);
    } else {
      subscribeMutation.mutate(summary.channelName);
    }
  };

  // Similar summaries — same category or same channel
  const similarSummaries = useMemo(() => {
    if (!summary || !communitySummaries) return [];
    return communitySummaries
      .filter(
        (s) =>
          s.id !== summary.id &&
          (s.category === summary.category || s.channelName === summary.channelName),
      )
      .slice(0, 8);
  }, [summary, communitySummaries]);

  // Unified "More like this" items — interleave summaries + channel videos
  const moreItems = useMemo((): MoreItem[] => {
    if (!summary) return [];
    const sums: MoreItem[] = similarSummaries.map((s) => ({ type: 'summary', data: s }));
    const summarisedIds = new Set(similarSummaries.map((s) => s.videoId));
    const vids: MoreItem[] = (channelVideos ?? [])
      .filter((v) => v.videoId !== summary.videoId && !summarisedIds.has(v.videoId))
      .slice(0, 6)
      .map((v) => ({ type: 'video', data: v }));
    // Interleave
    const items: MoreItem[] = [];
    let si = 0;
    let vi = 0;
    while (si < sums.length || vi < vids.length) {
      if (si < sums.length) items.push(sums[si++]);
      if (vi < vids.length) items.push(vids[vi++]);
    }
    return items;
  }, [summary, similarSummaries, channelVideos]);

  const handleSectionLayout = useCallback(
    (key: string) => (e: LayoutChangeEvent) => {
      sectionOffsets.current[key] = e.nativeEvent.layout.y;
    },
    [],
  );

  const scrollToSection = useCallback((key: SectionKey) => {
    setActiveSection(key);
    const offset = sectionOffsets.current[key];
    if (offset != null && scrollRef.current) {
      scrollRef.current.scrollTo({ y: offset - 60, animated: true });
    }
  }, []);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentY = e.nativeEvent.contentOffset.y;
      const viewportHeight = e.nativeEvent.layoutMeasurement.height;
      const threshold = viewportHeight * 0.10;
      const delta = currentY - lastScrollY.current;

      if (delta > 8) {
        // Scrolling down
        if (!wasScrollingDown.current) {
          wasScrollingDown.current = true;
          scrollDirectionAnchor.current = currentY;
        }
        setShowSectionNav(false);
      } else if (delta < -8) {
        // Scrolling up
        if (wasScrollingDown.current) {
          wasScrollingDown.current = false;
          scrollDirectionAnchor.current = currentY;
        }
        if (scrollDirectionAnchor.current - currentY > threshold) {
          setShowSectionNav(true);
        }
      }

      // At the top, always show
      if (currentY <= 10) {
        setShowSectionNav(true);
      }

      // Update active section based on scroll position
      const offsets = sectionOffsets.current;
      const scrollY = currentY + 100; // offset for header + nav height
      const keys: SectionKey[] = ['intro', 'summary', 'insights', 'resources', 'more'];
      let active: SectionKey = 'intro';
      for (const key of keys) {
        if (offsets[key] != null && scrollY >= offsets[key]) {
          active = key;
        }
      }
      setActiveSection(active);

      lastScrollY.current = currentY;
    },
    [],
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (error || !summary || !displaySummary) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Summary not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.linkText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const isShowingTranslation =
    needsTranslation && translationAvailable && !showOriginal;

  const speakerLinks =
    displaySummary.affiliateLinks.filter((l) => l.category === 'by_speaker');
  const recommendedLinks =
    displaySummary.affiliateLinks.filter((l) => l.category === 'recommended');

  return (
    <View style={styles.container}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      ref={scrollRef}
      onScroll={handleScroll}
      scrollEventThrottle={16}>
      {/* Video Player */}
      <View style={styles.videoPlayerContainer}>
        <MiniYouTubePlayer
          videoId={summary.videoId}
          startSeconds={0}
          sectionTitle={summary.videoTitle}
          onClose={() => {}}
          embedded
        />
      </View>

      {/* Video meta */}
      <View style={styles.videoMeta}>
        {isEditorsPick && (
          <View style={styles.editorsPickPill}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.editorsPickPillText}>Editor's Pick</Text>
          </View>
        )}
        <Text style={styles.videoTitle}>{summary.videoTitle}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.langBadge}>
            {(
              summary.originalLanguage ||
              summary.language ||
              'en'
            ).toUpperCase()}
          </Text>
          {summary.category && summary.category !== 'Other' && (
            <Text style={styles.categoryTag}>{summary.category}</Text>
          )}
          {isOfflineCached && (
            <View style={styles.offlineBadge}>
              <Ionicons name="cloud-done-outline" size={12} color={Colors.success} />
              <Text style={styles.offlineBadgeText}>Offline</Text>
            </View>
          )}
        </View>
        {isShowingTranslation && (
          <View style={styles.translationNotice}>
            <Ionicons
              name="language-outline"
              size={14}
              color={Colors.primary}
            />
            <Text style={styles.translationText}>
              Translated from {summary.originalLanguage.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Creator card — above the player */}
      <Pressable
        style={styles.creatorCard}
        onPress={() => router.push({ pathname: '/creator/[id]', params: { id: summary.channelName } })}>
        {channelInfo?.avatarUrl ? (
          <Image source={{ uri: channelInfo.avatarUrl }} style={styles.creatorAvatar} />
        ) : (
          <View style={[styles.creatorAvatar, styles.creatorAvatarFallback]}>
            <Text style={styles.creatorAvatarText}>
              {summary.channelName?.charAt(0)?.toUpperCase() ?? 'C'}
            </Text>
          </View>
        )}
        <Text style={styles.creatorName} numberOfLines={1}>
          {summary.channelName}
        </Text>
        <Pressable
          style={[styles.creatorBtn, isFollowing && styles.creatorBtnActive]}
          onPress={(e) => { e.stopPropagation(); handleToggleFollow(); }}
          disabled={isSubMutating}>
          <Ionicons
            name={isFollowing ? 'checkmark' : 'sparkles-outline'}
            size={14}
            color={isFollowing ? '#fff' : Colors.primary}
          />
          <Text style={[styles.creatorBtnText, isFollowing && styles.creatorBtnTextActive]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </Pressable>
        <Ionicons name="chevron-forward" size={16} color={Colors.tabIconDefault} />
      </Pressable>

      {/* Community Share Callout */}
      <View style={styles.blockSection}>
        {isOwner ? (
          <CommunityShareCallout
            isOwner
            isAnonymous={isAnonymous}
            isPending={togglePublishMutation.isPending}
            onToggleAnonymous={() => setIsAnonymous(!isAnonymous)}
          />
        ) : (
          <CommunityShareCallout
            isOwner={false}
            analystName={summary.analystName}
            analysisCount={summary.analysisCount}
          />
        )}
      </View>

      {/* Admin: Editor's Pick toggle */}
      {isAdmin && (
        <View style={styles.blockSection}>
          <Pressable
            style={[
              styles.adminPickBtn,
              isEditorsPick && styles.adminPickBtnActive,
            ]}
            onPress={() => togglePickMutation.mutate(id)}
            disabled={togglePickMutation.isPending}
            accessibilityLabel={isEditorsPick ? "Remove from Editor's Picks" : "Add to Editor's Picks"}
            accessibilityRole="button">
            <Ionicons
              name={isEditorsPick ? 'star' : 'star-outline'}
              size={16}
              color={isEditorsPick ? '#FFD700' : Colors.textSecondary}
            />
            <Text
              style={[
                styles.adminPickBtnText,
                isEditorsPick && styles.adminPickBtnTextActive,
              ]}>
              {togglePickMutation.isPending
                ? 'Updating...'
                : isEditorsPick
                  ? "Remove from Editor's Picks"
                  : "Add to Editor's Picks"}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Spacer for sticky section navigator */}

      {/* Intro */}
      <View
        style={styles.section}
        onLayout={handleSectionLayout('intro')}>
        <View style={styles.sectionHeader}>
          <Ionicons name="flash-outline" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Intro</Text>
        </View>
        <Text style={styles.quickSummaryText}>
          {displaySummary.quickSummary}
        </Text>
      </View>

      {/* Summary */}
      <View
        style={styles.section}
        onLayout={handleSectionLayout('summary')}>
        <View style={styles.sectionHeader}>
          <Ionicons name="book-outline" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.badge}>
            {getReadingTime(displaySummary.contextualSections)}
          </Text>
        </View>
        {displaySummary.contextualSections.map((section, index) => (
          <View key={index} style={styles.contextBlock}>
            <View style={styles.contextHeader}>
              <Text style={styles.contextTitle}>{section.title}</Text>
              <Text style={styles.timestamp}>
                {formatTimestamp(section.timestampStart)} -{' '}
                {formatTimestamp(section.timestampEnd)}
              </Text>
            </View>
            <Text style={styles.contextContent}>{section.content}</Text>
            <SectionActions
              summaryId={summary.id}
              sectionIndex={index}
              sectionTitle={section.title}
              sectionContent={section.content}
              videoTitle={summary.videoTitle}
              channelName={summary.channelName}
              videoId={summary.videoId}
              timestampStart={section.timestampStart}
              onPlay={(vid, start, title) => {
                if (tts.status === 'playing') tts.stop();
                setInlinePlayer({ videoId: vid, startSeconds: start, sectionTitle: title });
              }}
            />
          </View>
        ))}
      </View>

      {/* Refresher Cards CTA */}
      <View style={styles.refresherContainer}>
        <View style={styles.stackedCardsGraphic}>
          <View style={[styles.stackedCard, styles.stackedCard3]} />
          <View style={[styles.stackedCard, styles.stackedCard2]} />
          <View style={[styles.stackedCard, styles.stackedCard1]} />
        </View>
        <Text style={styles.refresherTitle}>
          {displaySummary.refresherCards.length} Refresher cards generated
        </Text>
        <Pressable
          style={styles.refresherCta}
          onPress={() => router.push(`/refresher/${id}`)}>
          <Text style={styles.refresherCtaText}>Review</Text>
        </Pressable>
      </View>

      {/* Actionable Insights */}
      {displaySummary.actionableInsights.length > 0 && (
        <View
          style={styles.section}
          onLayout={handleSectionLayout('insights')}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color={Colors.success}
            />
            <Text style={styles.sectionTitle}>Actionable Insights</Text>
          </View>
          {displaySummary.actionableInsights.map((item, index) => (
            <View key={index} style={styles.insightRow}>
              <Text style={styles.insightNumber}>{index + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.insightCategory}>{item.category}</Text>
                <Text style={styles.insightText}>{item.insight}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Books & Resources */}
      {displaySummary.affiliateLinks.length > 0 && (
        <View
          style={styles.section}
          onLayout={handleSectionLayout('resources')}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="bookmark-outline"
              size={18}
              color={Colors.warning}
            />
            <Text style={styles.sectionTitle}>Books & Resources</Text>
          </View>
          {speakerLinks.length > 0 && recommendedLinks.length > 0 && (
            <Text style={styles.resourceGroupLabel}>Mentioned in video</Text>
          )}
          {speakerLinks.map((link, index) => (
            <Pressable key={`s-${index}`} style={styles.affiliateCard}>
              <Ionicons
                name={getResourceIcon(link.type)}
                size={20}
                color={Colors.textSecondary}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.affiliateTitle}>{link.title}</Text>
                {link.author ? (
                  <Text style={styles.affiliateAuthor}>{link.author}</Text>
                ) : null}
              </View>
              <Ionicons
                name="open-outline"
                size={16}
                color={Colors.tabIconDefault}
              />
            </Pressable>
          ))}
          {recommendedLinks.length > 0 && (
            <>
              <Text style={styles.resourceGroupLabel}>Related resources</Text>
              {recommendedLinks.map((link, index) => (
                <Pressable key={`r-${index}`} style={styles.affiliateCard}>
                  <Ionicons
                    name={getResourceIcon(link.type)}
                    size={20}
                    color={Colors.textSecondary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.affiliateTitle}>{link.title}</Text>
                    {link.author ? (
                      <Text style={styles.affiliateAuthor}>{link.author}</Text>
                    ) : null}
                  </View>
                  <Ionicons
                    name="open-outline"
                    size={16}
                    color={Colors.tabIconDefault}
                  />
                </Pressable>
              ))}
            </>
          )}
          {speakerLinks.length === 0 &&
            recommendedLinks.length === 0 &&
            displaySummary.affiliateLinks.map((link, index) => (
              <Pressable key={index} style={styles.affiliateCard}>
                <Ionicons
                  name={getResourceIcon(link.type)}
                  size={20}
                  color={Colors.textSecondary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.affiliateTitle}>{link.title}</Text>
                  {link.author ? (
                    <Text style={styles.affiliateAuthor}>{link.author}</Text>
                  ) : null}
                </View>
                <Ionicons
                  name="open-outline"
                  size={16}
                  color={Colors.tabIconDefault}
                />
              </Pressable>
            ))}
        </View>
      )}

      {/* Creator card (bottom) */}
      <Pressable
        style={[styles.creatorCard, { marginTop: 24 }]}
        onPress={() => router.push({ pathname: '/creator/[id]', params: { id: summary.channelName } })}>
        {channelInfo?.avatarUrl ? (
          <Image source={{ uri: channelInfo.avatarUrl }} style={styles.creatorAvatar} />
        ) : (
          <View style={[styles.creatorAvatar, styles.creatorAvatarFallback]}>
            <Text style={styles.creatorAvatarText}>
              {summary.channelName?.charAt(0)?.toUpperCase() ?? 'C'}
            </Text>
          </View>
        )}
        <Text style={styles.creatorName} numberOfLines={1}>
          {summary.channelName}
        </Text>
        <Pressable
          style={[styles.creatorBtn, isFollowing && styles.creatorBtnActive]}
          onPress={(e) => { e.stopPropagation(); handleToggleFollow(); }}
          disabled={isSubMutating}>
          <Ionicons
            name={isFollowing ? 'checkmark' : 'sparkles-outline'}
            size={14}
            color={isFollowing ? '#fff' : Colors.primary}
          />
          <Text style={[styles.creatorBtnText, isFollowing && styles.creatorBtnTextActive]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </Pressable>
        <Ionicons name="chevron-forward" size={16} color={Colors.tabIconDefault} />
      </Pressable>

      {/* More like this — single mixed carousel */}
      <View
        style={styles.section}
        onLayout={handleSectionLayout('more')}>
        <View style={styles.sectionHeader}>
          <Ionicons name="grid-outline" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>More from {summary.channelName}</Text>
        </View>

        {moreItems.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.similarScroll}
            contentContainerStyle={styles.similarContent}>
            {moreItems.map((item) => {
              if (item.type === 'summary') {
                const s = item.data as Summary;
                return (
                  <Pressable
                    key={`s-${s.id}`}
                    style={styles.moreCard}
                    onPress={() => router.push(`/summary/${s.id}`)}>
                    <Image
                      source={{ uri: s.thumbnailUrl }}
                      style={styles.moreCardThumb}
                      contentFit="cover"
                    />
                    <View style={styles.moreCardInfo}>
                      <Text style={styles.moreCardTitle} numberOfLines={2}>
                        {s.videoTitle}
                      </Text>
                      <Text style={styles.moreCardMeta} numberOfLines={1}>
                        {s.channelName} · {getRelativeTime(s.createdAt)}
                      </Text>
                      {s.category && s.category !== 'Other' && (
                        <View style={styles.moreCardChip}>
                          <Text style={styles.moreCardChipText}>{s.category}</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              }
              const v = item.data as YouTubeVideo;
              const thumb = v.thumbnailUrl || `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`;
              return (
                <Pressable
                  key={`v-${v.videoId}`}
                  style={styles.moreCard}
                  onPress={() =>
                    router.push({
                      pathname: '/confirm-analyse',
                      params: {
                        videoId: v.videoId,
                        title: v.title,
                        channelName: v.channelName,
                        thumbnailUrl: thumb,
                        durationLabel: v.durationLabel ?? '',
                      },
                    })
                  }>
                  <View>
                    <Image
                      source={{ uri: thumb }}
                      style={styles.moreCardThumb}
                      contentFit="cover"
                    />
                    {v.durationLabel ? (
                      <View style={styles.moreCardDuration}>
                        <Text style={styles.moreCardDurationText}>{v.durationLabel}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.moreCardInfo}>
                    <Text style={styles.moreCardTitle} numberOfLines={2}>
                      {v.title}
                    </Text>
                    <Text style={styles.moreCardMeta} numberOfLines={1}>
                      {v.channelName} · {getRelativeTime(v.publishedAt)}
                    </Text>
                    <View style={styles.moreCardTag}>
                      <Ionicons name="sparkles-outline" size={13} color={Colors.primary} />
                      <Text style={styles.moreCardTagText}>{SUMMARIZE}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.moreEmpty}>
            <Ionicons name="videocam-outline" size={32} color={Colors.border} />
            <Text style={styles.moreEmptyText}>More summaries coming soon</Text>
          </View>
        )}
      </View>

      <View style={{ height: inlinePlayer ? PLAYER_HEIGHT + 120 : 100 }} />
    </ScrollView>

    {/* Sticky section navigator */}
    <SectionNavigator
      activeSection={activeSection}
      onPress={scrollToSection}
      visible={showSectionNav}
    />

    {/* Sticky bottom action bar */}
    <View style={styles.bottomBar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bottomBarContent}>
        {/* Translate — first if different language */}
        {needsTranslation && !isCheckingCache && !translationAvailable && (
          <Pressable
            style={[styles.actionPill, translateMutation.isPending && styles.actionPillDisabled]}
            onPress={handleTranslate}
            disabled={translateMutation.isPending}>
            {translateMutation.isPending ? (
              <ActivityIndicator color={Colors.textSecondary} size={12} />
            ) : (
              <Ionicons name="language-outline" size={16} color={Colors.textSecondary} />
            )}
            <Text style={styles.actionPillText}>Translate</Text>
          </Pressable>
        )}
        {needsTranslation && !isCheckingCache && translationAvailable && (
          <Pressable style={styles.actionPill} onPress={() => setShowOriginal(!showOriginal)}>
            <Ionicons name="swap-horizontal-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.actionPillText}>{showOriginal ? langLabel : 'Original'}</Text>
          </Pressable>
        )}
        <Pressable style={styles.actionPill} onPress={() => toggleLike(id)}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={16}
            color={isLiked ? Colors.error : Colors.textSecondary}
          />
          <Text style={[styles.actionPillText, isLiked && { color: Colors.error }]}>Like</Text>
        </Pressable>
        <Pressable style={styles.actionPill} onPress={handleSave}>
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={16}
            color={isSaved ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.actionPillText, isSaved && { color: Colors.primary }]}>Save</Text>
        </Pressable>
        <Pressable
          style={[styles.actionPill, tts.status === 'playing' && styles.actionPillActive]}
          onPress={tts.toggle}
          disabled={tts.isLoading}>
          {tts.isLoading ? (
            <ActivityIndicator color={Colors.primary} size={14} />
          ) : (
            <Ionicons
              name={tts.status === 'playing' ? 'pause' : 'headset-outline'}
              size={16}
              color={tts.status !== 'idle' ? Colors.primary : Colors.textSecondary}
            />
          )}
          <Text style={[styles.actionPillText, tts.status !== 'idle' && { color: Colors.primary }]}>
            {tts.isLoading ? 'Loading...' : tts.status === 'playing' ? 'Pause' : tts.status === 'paused' ? 'Resume' : 'Listen'}
          </Text>
          {tts.status === 'playing' && (
            <Pressable onPress={tts.stop} hitSlop={8}>
              <Ionicons name="stop" size={14} color={Colors.primary} />
            </Pressable>
          )}
          {!isPro && tts.status === 'idle' && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          )}
        </Pressable>
        <Pressable style={styles.actionPill} onPress={handleSummaryShare}>
          <Ionicons name="arrow-redo-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.actionPillText}>Share</Text>
        </Pressable>
        <Pressable style={styles.actionPill} onPress={handleReport}>
          <Ionicons name="flag-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.actionPillText}>Report</Text>
        </Pressable>
        {/* Translate — at end when same language */}
        {!needsTranslation && !translationAvailable && (
          <Pressable
            style={[styles.actionPill, translateMutation.isPending && styles.actionPillDisabled]}
            onPress={handleTranslate}
            disabled={translateMutation.isPending}>
            {translateMutation.isPending ? (
              <ActivityIndicator color={Colors.textSecondary} size={12} />
            ) : (
              <Ionicons name="language-outline" size={16} color={Colors.textSecondary} />
            )}
            <Text style={styles.actionPillText}>Translate</Text>
          </Pressable>
        )}
        {!needsTranslation && translationAvailable && (
          <Pressable style={styles.actionPill} onPress={() => setShowOriginal(!showOriginal)}>
            <Ionicons name="swap-horizontal-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.actionPillText}>{showOriginal ? langLabel : 'Original'}</Text>
          </Pressable>
        )}
        </ScrollView>
    </View>

    {inlinePlayer && (
      <MiniYouTubePlayer
        videoId={inlinePlayer.videoId}
        startSeconds={inlinePlayer.startSeconds}
        sectionTitle={inlinePlayer.sectionTitle}
        onClose={() => setInlinePlayer(null)}
      />
    )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingTop: 46,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  linkText: {
    fontSize: 16,
    color: Colors.primary,
  },
  videoPlayerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  videoMeta: {
    padding: 20,
    paddingBottom: 8,
  },
  videoTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  langBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    backgroundColor: Colors.border,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryTag: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  offlineBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.success,
  },
  proBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 2,
  },
  proBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
  },
  translationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  translationText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  /* Sticky bottom action bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    paddingBottom: 20,
  },
  bottomBarContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  moreCard: {
    width: 240,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  moreCardThumb: {
    width: '100%',
    height: 135,
    backgroundColor: Colors.border,
  },
  moreCardDuration: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  moreCardDurationText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  moreCardInfo: {
    padding: 10,
    gap: 4,
  },
  moreCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 19,
  },
  moreCardMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  moreCardChip: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 2,
  },
  moreCardChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  moreCardTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  moreCardTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  moreEmpty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  moreEmptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  actionPillActive: {
    backgroundColor: Colors.primary + '15',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  actionPillDisabled: {
    opacity: 0.6,
  },
  actionPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  blockSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  badge: {
    fontSize: 12,
    color: Colors.primary,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontWeight: '600',
    overflow: 'hidden',
  },
  quickSummaryText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 26,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  contextBlock: {
    marginBottom: 20,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  contextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  contextTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.tabIconDefault,
    fontFamily: 'SpaceMono',
  },
  contextContent: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  /* Refresher Cards CTA */
  refresherContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    margin: 20,
    alignItems: 'center',
  },
  stackedCardsGraphic: {
    width: 80,
    height: 50,
    marginBottom: 16,
  },
  stackedCard: {
    position: 'absolute',
    width: 60,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.primary + '15',
  },
  stackedCard1: {
    left: 10,
    top: 10,
    backgroundColor: Colors.primary + '30',
    zIndex: 3,
  },
  stackedCard2: {
    left: 5,
    top: 5,
    backgroundColor: Colors.primary + '20',
    zIndex: 2,
  },
  stackedCard3: {
    left: 0,
    top: 0,
    backgroundColor: Colors.primary + '15',
    zIndex: 1,
  },
  refresherTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  refresherCta: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  refresherCtaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  insightRow: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 12,
    alignItems: 'flex-start',
  },
  insightNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.success + '20',
    color: Colors.success,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 13,
    fontWeight: '700',
    overflow: 'hidden',
  },
  insightCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  insightText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  affiliateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  affiliateTitle: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  affiliateAuthor: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  resourceGroupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
  },
  creatorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  creatorAvatarFallback: {
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  creatorName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  creatorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  creatorBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  creatorBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  creatorBtnTextActive: {
    color: '#fff',
  },
  similarScroll: {
    marginHorizontal: -20,
  },
  similarContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  editorsPickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#FFD700' + '20',
    borderWidth: 1,
    borderColor: '#FFD700' + '40',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
  },
  editorsPickPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B8860B',
  },
  adminPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  adminPickBtnActive: {
    backgroundColor: '#FFD700' + '15',
    borderColor: '#FFD700' + '40',
  },
  adminPickBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  adminPickBtnTextActive: {
    color: '#B8860B',
    fontWeight: '600',
  },
});
