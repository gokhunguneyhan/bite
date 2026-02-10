import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useState, useMemo, useCallback } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/src/constants/colors';
import {
  useCommunitySummaries,
  useSubscriptions,
  useSubscribe,
  useUnsubscribe,
} from '@/src/hooks/useSummary';
import { usePreferences } from '@/src/hooks/usePreferences';
import { useCategoryVideos, getCategoryCreators } from '@/src/hooks/useCategoryVideos';
import { FEATURED_CREATORS } from '@/src/constants/featuredCreators';
import { CATEGORIES } from '@/src/types/summary';
import { VerticalVideoCard } from '@/src/components/summary/VerticalVideoCard';
import type { Summary } from '@/src/types/summary';

type ChipFilter = 'All' | 'Trending' | string;

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [searchActive, setSearchActive] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedChip, setSelectedChip] = useState<ChipFilter>('All');

  const { data: communitySummaries, isLoading } = useCommunitySummaries();
  const { data: preferences } = usePreferences();
  const { data: subscriptions } = useSubscriptions();
  const subscribeMutation = useSubscribe();
  const unsubscribeMutation = useUnsubscribe();
  const { data: categoryVideos, isLoading: isLoadingVideos } = useCategoryVideos(selectedChip);

  const followedChannels = useMemo(
    () => new Set(subscriptions?.map((s) => s.channelName.toLowerCase()) ?? []),
    [subscriptions],
  );

  // Channels matching the selected category
  const categoryCreators = useMemo(
    () => getCategoryCreators(selectedChip),
    [selectedChip],
  );

  // Build chip list: All + user interests (or top categories) + Trending
  const chips = useMemo(() => {
    const list: ChipFilter[] = ['All'];
    if (preferences?.interests?.length) {
      list.push(...preferences.interests);
    } else if (preferences?.preferredCategories?.length) {
      list.push(...preferences.preferredCategories);
    } else {
      list.push(...CATEGORIES.filter((c) => c !== 'Other').slice(0, 5));
    }
    list.push('Trending');
    return list;
  }, [preferences?.interests, preferences?.preferredCategories]);

  // Filtered feed based on selected chip
  const filteredSummaries = useMemo(() => {
    if (!communitySummaries) return [];
    if (selectedChip === 'All') return communitySummaries;
    if (selectedChip === 'Trending') {
      return [...communitySummaries].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    const q = selectedChip.toLowerCase();
    return communitySummaries.filter(
      (s) =>
        (s.category && s.category.toLowerCase().includes(q)) ||
        s.channelName.toLowerCase().includes(q),
    );
  }, [communitySummaries, selectedChip]);

  // Search results
  const isSearching = searchActive && search.trim().length > 0;
  const searchResults = useMemo(() => {
    if (!isSearching || !communitySummaries)
      return { summaries: [] as Summary[], channels: [] as string[], categories: [] as string[] };
    const q = search.toLowerCase();
    const summaries = communitySummaries.filter(
      (s) =>
        s.videoTitle.toLowerCase().includes(q) ||
        s.channelName.toLowerCase().includes(q) ||
        (s.category && s.category.toLowerCase().includes(q)),
    );
    const channelSet = new Set(summaries.map((s) => s.channelName));
    const matchingCreators = FEATURED_CREATORS.filter((c) =>
      c.name.toLowerCase().includes(q),
    );
    matchingCreators.forEach((c) => channelSet.add(c.name));
    const categories = CATEGORIES
      .filter((c) => c !== 'Other')
      .filter((c) => c.toLowerCase().includes(q));
    return { summaries, channels: [...channelSet].slice(0, 10), categories };
  }, [search, communitySummaries, isSearching]);

  const handleToggleFollow = useCallback(
    (channelName: string) => {
      if (followedChannels.has(channelName.toLowerCase())) {
        unsubscribeMutation.mutate(channelName);
      } else {
        subscribeMutation.mutate(channelName);
      }
    },
    [followedChannels, subscribeMutation, unsubscribeMutation],
  );

  const handleSearchToggle = () => {
    if (searchActive) {
      setSearch('');
      setSearchActive(false);
    } else {
      setSearchActive(true);
    }
  };

  // Whether we have real content for the selected category (not just empty)
  const hasSummaries = filteredSummaries.length > 0;
  const hasVideos = (categoryVideos?.length ?? 0) > 0;
  const hasCreators = categoryCreators.length > 0;

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Custom Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.addButton}
          onPress={() => router.push('/analyse')}
          accessibilityLabel="Analyse a new video"
          accessibilityRole="button">
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Explore</Text>
        <Pressable
          style={styles.searchButton}
          onPress={handleSearchToggle}
          accessibilityLabel={searchActive ? 'Close search' : 'Open search'}
          accessibilityRole="button">
          <Ionicons
            name={searchActive ? 'close' : 'search-outline'}
            size={22}
            color={Colors.text}
          />
        </Pressable>
      </View>

      {/* Search Input */}
      {searchActive && (
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={Colors.tabIconDefault} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search summaries, channels, categories..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={Colors.tabIconDefault}
            autoFocus
            accessibilityLabel="Search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={Colors.tabIconDefault} />
            </Pressable>
          )}
        </View>
      )}

      {/* Chip filters (when NOT searching) */}
      {!searchActive && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipContent}>
          {chips.map((chip) => {
            const isSelected = chip === selectedChip;
            return (
              <Pressable
                key={chip}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setSelectedChip(chip)}>
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {chip}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <ScrollView
        style={styles.feed}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag">
        {/* Search results mode */}
        {isSearching ? (
          <View style={styles.searchResults}>
            {searchResults.channels.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Channels</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.horizontalScroll}
                  contentContainerStyle={styles.horizontalContent}>
                  {searchResults.channels.map((ch) => (
                    <Pressable
                      key={ch}
                      style={styles.channelChip}
                      onPress={() =>
                        router.push({
                          pathname: '/creator/[id]',
                          params: { id: ch },
                        })
                      }>
                      <View style={styles.channelChipAvatar}>
                        <Text style={styles.channelChipInitial}>
                          {ch.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.channelChipName} numberOfLines={1}>
                        {ch}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}

            {searchResults.categories.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Categories</Text>
                <View style={styles.categoryChips}>
                  {searchResults.categories.map((cat) => (
                    <Pressable
                      key={cat}
                      style={styles.catLinkChip}
                      onPress={() =>
                        router.push({
                          pathname: '/category/[name]',
                          params: { name: cat },
                        })
                      }>
                      <Text style={styles.catLinkText}>Browse {cat}</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={14}
                        color={Colors.primary}
                      />
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.sectionTitle}>
              {searchResults.summaries.length > 0
                ? `${searchResults.summaries.length} result${searchResults.summaries.length !== 1 ? 's' : ''}`
                : 'No results'}
            </Text>
            {searchResults.summaries.length > 0 ? (
              searchResults.summaries
                .slice(0, 20)
                .map((s) => <VerticalVideoCard key={s.id} summary={s} />)
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="search-outline" size={32} color={Colors.tabIconDefault} />
                <Text style={styles.placeholderText}>
                  No summaries match "{search}"
                </Text>
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Community summaries */}
            {hasSummaries && (
              <>
                {selectedChip !== 'All' && (
                  <Text style={styles.sectionTitle}>Community Summaries</Text>
                )}
                {filteredSummaries.slice(0, 6).map((s) => (
                  <VerticalVideoCard key={s.id} summary={s} />
                ))}
              </>
            )}

            {/* Channels for this category */}
            {hasCreators && (
              <View style={styles.channelGridSection}>
                <Text style={styles.sectionTitle}>
                  {selectedChip !== 'All' && selectedChip !== 'Trending'
                    ? `${selectedChip} Channels`
                    : 'Top Channels to Follow'}
                </Text>
                <View style={styles.channelGrid}>
                  {categoryCreators.slice(0, 4).map((creator) => {
                    const isFollowed = followedChannels.has(
                      creator.name.toLowerCase(),
                    );
                    return (
                      <View key={creator.name} style={styles.channelGridCell}>
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: '/creator/[id]',
                              params: { id: creator.name },
                            })
                          }
                          style={styles.channelGridAvatarWrap}>
                          <View style={styles.channelGridAvatar}>
                            <Text style={styles.channelGridInitial}>
                              {creator.name.charAt(0)}
                            </Text>
                          </View>
                        </Pressable>
                        <Text style={styles.channelGridName} numberOfLines={1}>
                          {creator.name}
                        </Text>
                        <View style={styles.channelGridTag}>
                          <Text style={styles.channelGridTagText} numberOfLines={1}>
                            {creator.category}
                          </Text>
                        </View>
                        <Pressable
                          style={[
                            styles.followButton,
                            isFollowed && styles.followButtonActive,
                          ]}
                          onPress={() => handleToggleFollow(creator.name)}
                          accessibilityLabel={
                            isFollowed
                              ? `Unfollow ${creator.name}`
                              : `Follow ${creator.name}`
                          }
                          accessibilityRole="button">
                          <Text
                            style={[
                              styles.followButtonText,
                              isFollowed && styles.followButtonTextActive,
                            ]}>
                            {isFollowed ? 'Following' : 'Follow'}
                          </Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Latest videos from YouTube (real RSS data) */}
            {isLoadingVideos && (
              <ActivityIndicator color={Colors.primary} style={styles.videoLoader} />
            )}
            {hasVideos && (
              <>
                <Text style={styles.sectionTitle}>Latest Videos</Text>
                {categoryVideos!.map((video) => (
                  <Pressable
                    key={video.videoId}
                    style={styles.videoCard}
                    onPress={() =>
                      router.push({
                        pathname: '/confirm-analyse',
                        params: {
                          videoId: video.videoId,
                          title: video.title,
                          channelName: video.channelName,
                          thumbnailUrl: video.thumbnailUrl,
                          durationLabel: video.durationLabel ?? '',
                        },
                      })
                    }
                    accessibilityLabel={`Summarise ${video.title}`}
                    accessibilityRole="button">
                    <Image
                      source={{ uri: video.thumbnailUrl }}
                      style={styles.videoThumb}
                      resizeMode="cover"
                    />
                    <View style={styles.videoInfo}>
                      <Text style={styles.videoTitle} numberOfLines={2}>
                        {video.title}
                      </Text>
                      <Text style={styles.videoChannel} numberOfLines={1}>
                        {video.channelName}
                      </Text>
                    </View>
                    <View style={styles.summariseTag}>
                      <Ionicons name="sparkles" size={12} color="#fff" />
                      <Text style={styles.summariseTagText}>Summarise</Text>
                    </View>
                  </Pressable>
                ))}
              </>
            )}

            {/* More community summaries after channels & videos */}
            {hasSummaries && filteredSummaries.length > 6 && (
              <>
                {filteredSummaries.slice(6).map((s) => (
                  <VerticalVideoCard key={s.id} summary={s} />
                ))}
              </>
            )}

            {/* Empty state — only when no content at all */}
            {!hasSummaries && !hasVideos && !hasCreators && !isLoadingVideos && (
              <View style={styles.placeholder}>
                <Ionicons name="earth-outline" size={32} color={Colors.tabIconDefault} />
                <Text style={styles.placeholderText}>
                  {selectedChip !== 'All'
                    ? `No content in "${selectedChip}" yet.`
                    : 'No community summaries yet. Be the first to share!'}
                </Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
    marginHorizontal: 24,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  chipScroll: {
    maxHeight: 52,
    marginBottom: 4,
  },
  chipContent: {
    paddingHorizontal: 24,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    padding: 24,
    paddingTop: 12,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  // Channel grid
  channelGridSection: {
    marginBottom: 16,
    marginTop: 8,
  },
  channelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  channelGridCell: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  channelGridAvatarWrap: {
    marginBottom: 2,
  },
  channelGridAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  channelGridInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  channelGridName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  channelGridTag: {
    backgroundColor: Colors.primary + '12',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 24,
  },
  channelGridTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  followButton: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 2,
  },
  followButtonActive: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary + '40',
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  followButtonTextActive: {
    color: Colors.primary,
  },
  // Video cards (YouTube RSS)
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    marginBottom: 12,
  },
  videoThumb: {
    width: 100,
    height: 56,
    borderRadius: 8,
    backgroundColor: Colors.border,
  },
  videoInfo: {
    flex: 1,
    gap: 4,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
  },
  videoChannel: {
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
  videoLoader: {
    marginVertical: 16,
  },
  // Placeholder
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
  // Search results
  searchResults: {
    gap: 0,
  },
  horizontalScroll: {
    marginHorizontal: -24,
    marginBottom: 16,
  },
  horizontalContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  channelChip: {
    alignItems: 'center',
    width: 80,
  },
  channelChipAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  channelChipInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  channelChipName: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  catLinkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary + '10',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  catLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
});
