import { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
  LayoutChangeEvent,
} from 'react-native';
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
import { ChannelInfoBlock } from '@/src/components/summary/ChannelInfoBlock';
import { CommunityShareCallout } from '@/src/components/summary/CommunityShareCallout';
import { SectionActions } from '@/src/components/summary/SectionActions';
import { SectionNavigator } from '@/src/components/summary/SectionNavigator';
import type { SectionKey } from '@/src/components/summary/SectionNavigator';
import { VerticalVideoCard } from '@/src/components/summary/VerticalVideoCard';
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
  // isAnonymous is local state for now — TODO: persist to Supabase
  const [isAnonymous, setIsAnonymous] = useState(true);

  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<string, number>>({});

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
    <ScrollView style={styles.container} ref={scrollRef}>
      {/* Thumbnail */}
      <Image
        source={{ uri: summary.thumbnailUrl }}
        style={styles.thumbnail}
        resizeMode="cover"
      />

      {/* Video meta — preserved */}
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

      {/* Channel Info Block */}
      <View style={styles.blockSection}>
        <ChannelInfoBlock
          channelName={summary.channelName}
          isFollowing={isFollowing}
          isMutating={isSubMutating}
          onToggleFollow={() => {
            if (isSubMutating) return;
            if (isFollowing) {
              unsubscribeMutation.mutate(summary.channelName);
            } else {
              subscribeMutation.mutate(summary.channelName);
            }
          }}
        />
      </View>

      {/* Translate button */}
      {needsTranslation && !isCheckingCache && (
        <View style={styles.blockSection}>
          {translationAvailable ? (
            <Pressable
              style={styles.showOriginalToggle}
              onPress={() => setShowOriginal(!showOriginal)}>
              <Ionicons
                name="swap-horizontal-outline"
                size={16}
                color={Colors.primary}
              />
              <Text style={styles.showOriginalText}>
                {showOriginal
                  ? `Show ${langLabel} translation`
                  : 'Show original'}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={[
                styles.translateButton,
                translateMutation.isPending && styles.translateButtonLoading,
              ]}
              onPress={handleTranslate}
              disabled={translateMutation.isPending}>
              {translateMutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="language-outline" size={18} color="#fff" />
                  <Text style={styles.translateButtonText}>
                    Translate to {langLabel}
                  </Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      )}

      {/* Community Share Callout */}
      <View style={styles.blockSection}>
        {isOwner ? (
          <CommunityShareCallout
            isOwner
            isPublic={summary.isPublic ?? false}
            isAnonymous={isAnonymous}
            isPending={togglePublishMutation.isPending}
            onTogglePublic={() =>
              togglePublishMutation.mutate({
                id: summary.id,
                isPublic: !summary.isPublic,
              })
            }
            onToggleAnonymous={() => setIsAnonymous(!isAnonymous)}
          />
        ) : (
          <CommunityShareCallout
            isOwner={false}
            analystName={undefined}
            analysisCount={undefined}
          />
        )}
      </View>

      {/* Section Navigator */}
      <SectionNavigator
        activeSection={activeSection}
        onPress={scrollToSection}
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
            />
          </View>
        ))}
      </View>

      {/* Refresher Cards CTA */}
      <Pressable
        style={styles.refresherButton}
        onPress={() => router.push(`/refresher/${id}`)}>
        <Ionicons name="albums-outline" size={20} color="#fff" />
        <Text style={styles.refresherButtonText}>
          Start Refresher Cards ({displaySummary.refresherCards.length})
        </Text>
      </Pressable>

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

      <View style={{ height: 60 }} />
    </ScrollView>
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
  blockSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  showOriginalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  showOriginalText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  translateButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  translateButtonLoading: {
    opacity: 0.7,
  },
  translateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  refresherButton: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  refresherButtonText: {
    color: '#fff',
    fontSize: 17,
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
});
