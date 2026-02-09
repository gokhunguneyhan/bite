import {
  View,
  Text,
  Pressable,
  ScrollView,
  FlatList,
  Image,
  StyleSheet,
} from 'react-native';
import { useState, useMemo, useCallback } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '@/src/providers/SessionProvider';
import { Colors } from '@/src/constants/colors';
import { useSummaries, useSubscriptions } from '@/src/hooks/useSummary';
import { useBookmarkStore, type Bookmark } from '@/src/stores/bookmarkStore';
import { useUserFollowStore } from '@/src/stores/userFollowStore';
import { SummaryCard } from '@/src/components/summary/SummaryCard';
import { SwipeableRow } from '@/src/components/summary/SwipeableRow';
import type { Summary } from '@/src/types/summary';

type ProfileTab = 'history' | 'bookmarks' | 'refresher';

export default function ProfileScreen() {
  const { user, profile } = useSession();
  const { data: summaries } = useSummaries();
  const { data: subscriptions } = useSubscriptions();
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const removeBookmark = useBookmarkStore((s) => s.removeBookmark);
  const follows = useUserFollowStore((s) => s.follows);

  const [activeTab, setActiveTab] = useState<ProfileTab>('history');

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  const summaryCount = summaries?.length ?? 0;
  const followingCount = (subscriptions?.length ?? 0) + follows.length;
  // TODO: Replace with real data from Supabase
  const followersCount = 0;

  // Stats calculations
  const stats = useMemo(() => {
    if (!summaries || summaries.length === 0)
      return { hours: '0', words: '0' };

    // Estimate: average video ~15 min each
    const totalMinutes = summaries.length * 15;
    const hours =
      totalMinutes >= 60
        ? `${Math.round(totalMinutes / 60)}`
        : `${totalMinutes}m`;

    // Count words across quickSummary + all contextualSections
    let wordCount = 0;
    for (const s of summaries) {
      if (s.quickSummary) wordCount += s.quickSummary.split(/\s+/).length;
      for (const section of s.contextualSections ?? []) {
        if (section.content) wordCount += section.content.split(/\s+/).length;
      }
    }
    const words =
      wordCount >= 1000
        ? `${(wordCount / 1000).toFixed(1)}k`
        : `${wordCount}`;

    return { hours, words };
  }, [summaries]);

  // Refresher card summaries
  const refresherSummaries = useMemo(
    () => (summaries ?? []).filter((s) => s.refresherCards?.length > 0),
    [summaries],
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'history':
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
              <SummaryCard key={s.id} summary={s} />
            ))}
          </View>
        );

      case 'bookmarks':
        if (bookmarks.length === 0) {
          return (
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>No bookmarks yet</Text>
              <Text style={styles.emptySubtext}>
                Bookmark sections from your summaries to find them here.
              </Text>
            </View>
          );
        }
        return (
          <FlatList
            data={bookmarks}
            keyExtractor={(item) => item.id}
            renderItem={renderBookmarkItem}
            scrollEnabled={false}
            contentContainerStyle={styles.tabContent}
          />
        );

      case 'refresher':
        if (refresherSummaries.length === 0) {
          return (
            <View style={styles.emptyState}>
              <Ionicons name="albums-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>No refresher cards yet</Text>
              <Text style={styles.emptySubtext}>
                Analyse videos to generate refresher cards.
              </Text>
            </View>
          );
        }
        return (
          <FlatList
            data={refresherSummaries}
            keyExtractor={(item) => item.id}
            renderItem={renderRefresherItem}
            scrollEnabled={false}
            contentContainerStyle={styles.tabContent}
          />
        );
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

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{summaryCount}</Text>
          <Text style={styles.statLabel}>Summaries</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{stats.hours}</Text>
          <Text style={styles.statLabel}>Hours saved</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{stats.words}</Text>
          <Text style={styles.statLabel}>Words read</Text>
        </View>
      </View>

      {/* Social Section */}
      <View style={styles.socialRow}>
        <Pressable
          style={styles.socialItem}
          onPress={() => router.push('/following')}
          accessibilityLabel={`${followingCount} following`}
          accessibilityRole="button">
          <Text style={styles.socialNumber}>{followingCount}</Text>
          <Text style={styles.socialLabel}>Following</Text>
        </Pressable>
        <View style={styles.socialDivider} />
        <Pressable
          style={styles.socialItem}
          onPress={() => router.push('/followers')}
          accessibilityLabel={`${followersCount} followers`}
          accessibilityRole="button">
          <Text style={styles.socialNumber}>{followersCount}</Text>
          <Text style={styles.socialLabel}>Followers</Text>
        </Pressable>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabBar}>
        {(['history', 'bookmarks', 'refresher'] as const).map((tab) => {
          const isActive = activeTab === tab;
          const labels = {
            history: 'History',
            bookmarks: 'Bookmarks',
            refresher: 'Refresher Cards',
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

      {/* Settings Link */}
      <Pressable
        style={styles.settingsLink}
        onPress={() => router.push('/(app)/(tabs)/more')}
        accessibilityLabel="Settings and More"
        accessibilityRole="button">
        <Ionicons name="settings-outline" size={20} color={Colors.text} />
        <Text style={styles.settingsText}>Settings & More</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
      </Pressable>
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
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 18,
    marginBottom: 10,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
  socialRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  socialItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  socialNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  socialLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  socialDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
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
  settingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    gap: 12,
  },
  settingsText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
});
