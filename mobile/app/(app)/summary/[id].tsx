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
import { ChannelInfoBlock } from '@/src/components/summary/ChannelInfoBlock';
import { CommunityShareCallout } from '@/src/components/summary/CommunityShareCallout';
import { SectionActions } from '@/src/components/summary/SectionActions';
import { SectionNavigator } from '@/src/components/summary/SectionNavigator';
import type { SectionKey } from '@/src/components/summary/SectionNavigator';
import { VerticalVideoCard } from '@/src/components/summary/VerticalVideoCard';
import { useToast } from '@/src/components/ui/Toast';
import { useTTS } from '@/src/hooks/useTTS';
import { useOfflineStore } from '@/src/stores/offlineStore';
import { useRevenueCat } from '@/src/providers/RevenueCatProvider';
import MiniYouTubePlayer, { PLAYER_HEIGHT } from '@/src/components/summary/MiniYouTubePlayer';
import type { Summary } from '@/src/types/summary';

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

export default function SummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: summary, isLoading, error } = useSummary(id);
  const { data: communitySummaries } = useCommunitySummaries();
  const { user } = useSession();
  const language = useSettingsStore((s) => s.language);
  const translateMutation = useTranslateSummary();
  const togglePublishMutation = useTogglePublish();
  const [showOriginal, setShowOriginal] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>('summary');
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

  // Scroll direction tracking
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const lastScrollY = useRef(0);

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

  // Similar summaries in same category
  const similarSummaries = useMemo(() => {
    if (!summary || !communitySummaries) return [];
    return communitySummaries
      .filter(
        (s) =>
          s.id !== summary.id &&
          s.category &&
          s.category === summary.category,
      )
      .slice(0, 5);
  }, [summary, communitySummaries]);

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
      if (currentY > lastScrollY.current + 5) {
        setScrollDirection('down');
      } else if (currentY < lastScrollY.current - 5) {
        setScrollDirection('up');
      }
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
      ref={scrollRef}
      onScroll={handleScroll}
      scrollEventThrottle={16}>
      {/* Thumbnail */}
      <Image
        source={{ uri: summary.thumbnailUrl }}
        style={styles.thumbnail}
        contentFit="cover"
      />

      {/* Video meta */}
      <View style={styles.videoMeta}>
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

      {/* Action CTAs Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actionCtasContainer}
        style={styles.actionCtasScroll}>
        {needsTranslation && !isCheckingCache && !translationAvailable && (
          <Pressable
            style={[
              styles.actionPill,
              translateMutation.isPending && styles.actionPillDisabled,
            ]}
            onPress={handleTranslate}
            disabled={translateMutation.isPending}>
            {translateMutation.isPending ? (
              <ActivityIndicator color={Colors.primary} size={12} />
            ) : (
              <Ionicons name="language-outline" size={16} color={Colors.primary} />
            )}
            <Text style={styles.actionPillText}>Translate</Text>
          </Pressable>
        )}
        {needsTranslation && !isCheckingCache && translationAvailable && (
          <Pressable
            style={styles.actionPill}
            onPress={() => setShowOriginal(!showOriginal)}>
            <Ionicons name="swap-horizontal-outline" size={16} color={Colors.primary} />
            <Text style={styles.actionPillText}>
              {showOriginal ? langLabel : 'Original'}
            </Text>
          </Pressable>
        )}
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
        <Pressable
          style={styles.actionPill}
          onPress={() => toggleLike(id)}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={16}
            color={isLiked ? Colors.error : Colors.textSecondary}
          />
          <Text style={[styles.actionPillText, isLiked && { color: Colors.error }]}>
            Like
          </Text>
        </Pressable>
        <Pressable
          style={styles.actionPill}
          onPress={handleSave}>
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={16}
            color={isSaved ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.actionPillText, isSaved && { color: Colors.primary }]}>
            Save
          </Text>
        </Pressable>
        <Pressable
          style={styles.actionPill}
          onPress={handleSummaryShare}>
          <Ionicons name="arrow-redo-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.actionPillText}>Share</Text>
        </Pressable>
        <Pressable
          style={styles.actionPill}
          onPress={handleReport}>
          <Ionicons name="flag-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.actionPillText}>Report</Text>
        </Pressable>
      </ScrollView>

      {/* Channel Info Block */}
      <View style={styles.blockSection}>
        <ChannelInfoBlock
          channelName={summary.channelName}
          isFollowing={isFollowing}
          isMutating={isSubMutating}
          onToggleFollow={handleToggleFollow}
        />
      </View>

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

      {/* Section Navigator */}
      <SectionNavigator
        activeSection={activeSection}
        onPress={scrollToSection}
        scrollDirection={scrollDirection}
      />

      {/* Quick Summary */}
      <View
        style={styles.section}
        onLayout={handleSectionLayout('summary')}>
        <View style={styles.sectionHeader}>
          <Ionicons name="flash-outline" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Quick Summary</Text>
        </View>
        <Text style={styles.quickSummaryText}>
          {displaySummary.quickSummary}
        </Text>
      </View>

      {/* Contextual Summary */}
      <View
        style={styles.section}
        onLayout={handleSectionLayout('context')}>
        <View style={styles.sectionHeader}>
          <Ionicons name="book-outline" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Contextual Summary</Text>
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

      {/* You might also like */}
      {similarSummaries.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.similarTitle}>You might also like</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.similarScroll}
            contentContainerStyle={styles.similarContent}>
            {similarSummaries.map((s) => (
              <View key={s.id} style={styles.similarCard}>
                <VerticalVideoCard summary={s} />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Bottom Action Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actionCtasContainer}
        style={styles.bottomActionsScroll}>
        <Pressable
          style={styles.actionPill}
          onPress={() => toggleLike(id)}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={16}
            color={isLiked ? Colors.error : Colors.textSecondary}
          />
          <Text style={[styles.actionPillText, isLiked && { color: Colors.error }]}>
            Like
          </Text>
        </Pressable>
        <Pressable
          style={styles.actionPill}
          onPress={handleSave}>
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={16}
            color={isSaved ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.actionPillText, isSaved && { color: Colors.primary }]}>
            Save
          </Text>
        </Pressable>
        <Pressable
          style={styles.actionPill}
          onPress={handleSummaryShare}>
          <Ionicons name="arrow-redo-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.actionPillText}>Share</Text>
        </Pressable>
        <Pressable
          style={styles.actionPill}
          onPress={handleReport}>
          <Ionicons name="flag-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.actionPillText}>Report</Text>
        </Pressable>
        <Pressable
          style={styles.actionPill}
          onPress={handleToggleFollow}
          disabled={isSubMutating}>
          <Ionicons
            name={isFollowing ? 'checkmark-circle' : 'add-circle-outline'}
            size={16}
            color={isFollowing ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.actionPillText, isFollowing && { color: Colors.primary }]}>
            {isFollowing ? 'Following' : 'Follow Channel'}
          </Text>
        </Pressable>
      </ScrollView>

      <View style={{ height: inlinePlayer ? PLAYER_HEIGHT + 80 : 60 }} />
    </ScrollView>

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
  thumbnail: {
    width: '100%',
    height: 220,
    backgroundColor: Colors.border,
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
  /* Action CTAs row */
  actionCtasScroll: {
    marginTop: 4,
  },
  actionCtasContainer: {
    paddingHorizontal: 20,
    gap: 8,
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
  similarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  similarScroll: {
    marginHorizontal: -20,
  },
  similarContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  similarCard: {
    width: 200,
  },
  bottomActionsScroll: {
    marginTop: 20,
    marginBottom: 4,
  },
});
