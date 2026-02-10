import {
  View,
  Text,
  Pressable,
  ScrollView,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useState, useMemo, useCallback } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '@/src/providers/SessionProvider';
import { Colors } from '@/src/constants/colors';
import { useSummaries, useSubscriptions, useImportYouTubeSubscriptions } from '@/src/hooks/useSummary';
import { usePreferences, useOnboardingStatus } from '@/src/hooks/usePreferences';
import { useToast } from '@/src/components/ui/Toast';
import { useBookmarkStore, type Bookmark } from '@/src/stores/bookmarkStore';
import { useUserFollowStore } from '@/src/stores/userFollowStore';
import { VerticalVideoCard } from '@/src/components/summary/VerticalVideoCard';
import { SwipeableRow } from '@/src/components/summary/SwipeableRow';
import type { Summary } from '@/src/types/summary';

type ProfileTab = 'summaries' | 'saved';
type SavedFilter = 'all' | 'videos' | 'sections' | 'refreshers';

export default function ProfileScreen() {
  const { user, profile } = useSession();
  const { data: summaries } = useSummaries();
  const { data: subscriptions } = useSubscriptions();
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const removeBookmark = useBookmarkStore((s) => s.removeBookmark);
  const follows = useUserFollowStore((s) => s.follows);
  const { data: preferences } = usePreferences();
  const { data: hasOnboarded } = useOnboardingStatus();
  const showToast = useToast();
  const importMutation = useImportYouTubeSubscriptions();

  const [activeTab, setActiveTab] = useState<ProfileTab>('summaries');
  const [savedFilter, setSavedFilter] = useState<SavedFilter>('all');

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  const summaryCount = summaries?.length ?? 0;
  const followingCount = (subscriptions?.length ?? 0) + follows.length;
  // TODO: Replace with real data from Supabase
  const followersCount = 0;

  const hasPersonalised = hasOnboarded === true;
  const hasSubscriptions = (subscriptions?.length ?? 0) > 0;

  const handleImportYouTube = () => {
    importMutation.mutate(undefined, {
      onSuccess: (imported) => showToast(`Imported ${imported.length} channels`),
      onError: () => showToast('Failed to import channels'),
    });
  };

  // Hours saved calculation
  const hoursSaved = useMemo(() => {
    if (!summaries || summaries.length === 0) return '0';
    const totalMinutes = summaries.length * 15;
    return totalMinutes >= 60
      ? `${Math.round(totalMinutes / 60)}`
      : `${totalMinutes}m`;
  }, [summaries]);

  // Refresher card summaries
  const refresherSummaries = useMemo(
    () => (summaries ?? []).filter((s) => s.refresherCards?.length > 0),
    [summaries],
  );

  // Filtered bookmarks for the Saved tab
  const videoBookmarks = useMemo(
    () => bookmarks.filter((b) => b.sectionIndex === undefined || b.sectionTitle === b.videoTitle),
    [bookmarks],
  );

  const sectionBookmarks = useMemo(
    () => bookmarks.filter((b) => b.sectionTitle && b.sectionTitle !== b.videoTitle),
    [bookmarks],
  );

  const renderBookmarkItem = useCallback(
    ({ item }: { item: Bookmark }) => (
      <SwipeableRow
        onDelete={() => removeBookmark(item.summaryId, item.sectionIndex)}>
        <Pressable
          style={styles.bookmarkRow}
          onPress={() => router.push(`/summary/${item.summaryId}`)}
          accessibilityLabel={`View bookmark: ${item.sectionTitle}`}
          accessibilityRole="button">
          <View style={styles.bookmarkContent}>
            <Text style={styles.bookmarkTitle} numberOfLines={1}>
              {item.videoTitle}
            </Text>
            <Text style={styles.bookmarkSection} numberOfLines={1}>
              {item.sectionTitle}
            </Text>
            <Text style={styles.bookmarkSnippet} numberOfLines={2}>
              {item.sectionContent}
            </Text>
          </View>
        </Pressable>
      </SwipeableRow>
    ),
    [removeBookmark],
  );

  const renderRefresherItem = useCallback(
    ({ item }: { item: Summary }) => (
      <Pressable
        style={styles.refresherRow}
        onPress={() => router.push(`/refresher/${item.id}`)}
        accessibilityLabel={`Review ${item.refresherCards.length} cards for ${item.videoTitle}`}
        accessibilityRole="button">
        <Image
          source={{ uri: item.thumbnailUrl }}
          style={styles.refresherThumb}
          resizeMode="cover"
        />
        <View style={styles.refresherInfo}>
          <Text style={styles.refresherTitle} numberOfLines={2}>
            {item.videoTitle}
          </Text>
          <View style={styles.refresherMeta}>
            <Ionicons name="albums-outline" size={14} color={Colors.primary} />
            <Text style={styles.refresherCardCount}>
              {item.refresherCards.length} cards
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
      </Pressable>
    ),
    [],
  );

  const renderSavedContent = () => {
    const filters: { key: SavedFilter; label: string }[] = [
      { key: 'all', label: 'All' },
      { key: 'videos', label: 'Videos' },
      { key: 'sections', label: 'Sections' },
      { key: 'refreshers', label: 'Refreshers' },
    ];

    let content: React.ReactNode;

    switch (savedFilter) {
      case 'all': {
        const hasBookmarks = bookmarks.length > 0;
        const hasRefreshers = refresherSummaries.length > 0;
        if (!hasBookmarks && !hasRefreshers) {
          content = (
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>Nothing saved yet</Text>
              <Text style={styles.emptySubtext}>
                Bookmark sections or generate refresher cards to see them here.
              </Text>
            </View>
          );
        } else {
          content = (
            <View style={styles.tabContent}>
              {bookmarks.map((b) => (
                <SwipeableRow
                  key={b.id}
                  onDelete={() => removeBookmark(b.summaryId, b.sectionIndex)}>
                  <Pressable
                    style={styles.bookmarkRow}
                    onPress={() => router.push(`/summary/${b.summaryId}`)}
                    accessibilityLabel={`View bookmark: ${b.sectionTitle}`}
                    accessibilityRole="button">
                    <View style={styles.bookmarkContent}>
                      <Text style={styles.bookmarkTitle} numberOfLines={1}>
                        {b.videoTitle}
                      </Text>
                      <Text style={styles.bookmarkSection} numberOfLines={1}>
                        {b.sectionTitle}
                      </Text>
                      <Text style={styles.bookmarkSnippet} numberOfLines={2}>
                        {b.sectionContent}
                      </Text>
                    </View>
                  </Pressable>
                </SwipeableRow>
              ))}
              {refresherSummaries.map((s) => (
                <Pressable
                  key={`refresher-${s.id}`}
                  style={styles.refresherRow}
                  onPress={() => router.push(`/refresher/${s.id}`)}
                  accessibilityLabel={`Review ${s.refresherCards.length} cards for ${s.videoTitle}`}
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
                    <View style={styles.refresherMeta}>
                      <Ionicons name="albums-outline" size={14} color={Colors.primary} />
                      <Text style={styles.refresherCardCount}>
                        {s.refresherCards.length} cards
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
                </Pressable>
              ))}
            </View>
          );
        }
        break;
      }
      case 'videos': {
        if (videoBookmarks.length === 0) {
          content = (
            <View style={styles.emptyState}>
              <Ionicons name="videocam-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>No video bookmarks</Text>
              <Text style={styles.emptySubtext}>
                Bookmark full summaries to find them here.
              </Text>
            </View>
          );
        } else {
          content = (
            <FlatList
              data={videoBookmarks}
              keyExtractor={(item) => item.id}
              renderItem={renderBookmarkItem}
              scrollEnabled={false}
              contentContainerStyle={styles.tabContent}
            />
          );
        }
        break;
      }
      case 'sections': {
        if (sectionBookmarks.length === 0) {
          content = (
            <View style={styles.emptyState}>
              <Ionicons name="list-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>No section bookmarks</Text>
              <Text style={styles.emptySubtext}>
                Bookmark specific sections from summaries to find them here.
              </Text>
            </View>
          );
        } else {
          content = (
            <FlatList
              data={sectionBookmarks}
              keyExtractor={(item) => item.id}
              renderItem={renderBookmarkItem}
              scrollEnabled={false}
              contentContainerStyle={styles.tabContent}
            />
          );
        }
        break;
      }
      case 'refreshers': {
        if (refresherSummaries.length === 0) {
          content = (
            <View style={styles.emptyState}>
              <Ionicons name="albums-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>No refresher cards yet</Text>
              <Text style={styles.emptySubtext}>
                Analyse videos to generate refresher cards.
              </Text>
            </View>
          );
        } else {
          content = (
            <FlatList
              data={refresherSummaries}
              keyExtractor={(item) => item.id}
              renderItem={renderRefresherItem}
              scrollEnabled={false}
              contentContainerStyle={styles.tabContent}
            />
          );
        }
        break;
      }
    }

    return (
      <>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          style={styles.chipScroll}>
          {filters.map((f) => {
            const selected = savedFilter === f.key;
            return (
              <Pressable
                key={f.key}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setSavedFilter(f.key)}
                accessibilityLabel={f.label}
                accessibilityRole="button"
                accessibilityState={{ selected }}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        {content}
      </>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'summaries':
        if (!summaries || summaries.length === 0) {
          return (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>No summaries yet</Text>
              <Text style={styles.emptySubtext}>
                Analyse a YouTube video to see it here.
              </Text>
            </View>
          );
        }
        return (
          <View style={styles.tabContent}>
            {summaries.map((s) => (
              <VerticalVideoCard key={s.id} summary={s} />
            ))}
          </View>
        );

      case 'saved':
        return renderSavedContent();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        {displayEmail ? <Text style={styles.email}>{displayEmail}</Text> : null}
      </View>

      {/* Combined Metrics Row */}
      <View style={styles.metricsRow}>
        <Pressable
          style={styles.metric}
          onPress={() => router.push('/following')}
          accessibilityLabel={`${followingCount} following`}
          accessibilityRole="button">
          <Text style={styles.metricNumber}>{followingCount}</Text>
          <Text style={styles.metricLabel}> Following</Text>
        </Pressable>
        <Pressable
          style={styles.metric}
          onPress={() => router.push('/followers')}
          accessibilityLabel={`${followersCount} followers`}
          accessibilityRole="button">
          <Text style={styles.metricNumber}>{followersCount}</Text>
          <Text style={styles.metricLabel}> Followers</Text>
        </Pressable>
        <View style={styles.metric}>
          <Text style={styles.metricNumber}>{summaryCount}</Text>
          <Text style={styles.metricLabel}> Summaries</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabelLight}>{hoursSaved} hours caught up</Text>
        </View>
      </View>

      {/* Setup Banner */}
      {(!hasPersonalised || !hasSubscriptions) && (
        <View style={styles.setupCard}>
          <Ionicons name="construct-outline" size={20} color={Colors.primary} />
          <View style={styles.setupContent}>
            <Text style={styles.setupTitle}>Complete your setup</Text>
            <View style={styles.setupActions}>
              {!hasPersonalised && (
                <Pressable
                  style={styles.setupBtn}
                  onPress={() => router.push('/personalise')}
                  accessibilityLabel="Personalise your feed"
                  accessibilityRole="button">
                  <Ionicons name="sparkles-outline" size={14} color={Colors.primary} />
                  <Text style={styles.setupBtnText}>Personalise feed</Text>
                </Pressable>
              )}
              {!hasSubscriptions && (
                <Pressable
                  style={styles.setupBtn}
                  onPress={handleImportYouTube}
                  disabled={importMutation.isPending}
                  accessibilityLabel="Import YouTube subscriptions"
                  accessibilityRole="button">
                  {importMutation.isPending ? (
                    <ActivityIndicator color={Colors.primary} size="small" />
                  ) : (
                    <>
                      <Ionicons name="logo-youtube" size={14} color={Colors.primary} />
                      <Text style={styles.setupBtnText}>Import channels</Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>
          </View>
        </View>
      )}
      {hasPersonalised && hasSubscriptions && (
        <Pressable
          style={styles.manageLink}
          onPress={() => router.push('/personalise')}
          accessibilityLabel="Manage preferences"
          accessibilityRole="button">
          <Ionicons name="settings-outline" size={14} color={Colors.primary} />
          <Text style={styles.manageLinkText}>Manage preferences</Text>
        </Pressable>
      )}

      {/* Tab Switcher */}
      <View style={styles.tabBar}>
        {(['summaries', 'saved'] as const).map((tab) => {
          const isActive = activeTab === tab;
          const labels = {
            summaries: 'Summaries',
            saved: 'Saved',
          };
          return (
            <Pressable
              key={tab}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
              accessibilityLabel={labels[tab]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}>
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {labels[tab]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Tab Content */}
      {renderTabContent()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginVertical: 16,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  metricLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  metricLabelLight: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  setupCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '08',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  setupContent: {
    flex: 1,
    gap: 8,
  },
  setupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  setupActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  setupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  setupBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  manageLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  manageLinkText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.primary,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: Colors.background,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.text,
  },
  tabContent: {
    gap: 0,
  },
  chipScroll: {
    marginBottom: 12,
  },
  chipRow: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  bookmarkRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  bookmarkContent: {
    flex: 1,
    gap: 4,
  },
  bookmarkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  bookmarkSection: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.primary,
  },
  bookmarkSnippet: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  refresherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  refresherThumb: {
    width: 60,
    height: 40,
    borderRadius: 6,
    backgroundColor: Colors.border,
  },
  refresherInfo: {
    flex: 1,
  },
  refresherTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
  },
  refresherMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  refresherCardCount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
});
