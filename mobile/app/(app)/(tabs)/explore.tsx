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
import { Colors } from '@/src/constants/colors';
import {
  useCommunitySummaries,
  useSubscriptions,
  useSubscribe,
  useUnsubscribe,
} from '@/src/hooks/useSummary';
import { usePreferences } from '@/src/hooks/usePreferences';
import { FEATURED_CREATORS } from '@/src/constants/featuredCreators';
import { VerticalVideoCard } from '@/src/components/summary/VerticalVideoCard';
import { CategoryGrid } from '@/src/components/explore/CategoryGrid';
import type { Summary } from '@/src/types/summary';

export default function ExploreScreen() {
  const [search, setSearch] = useState('');
  const { data: communitySummaries, isLoading } = useCommunitySummaries();
  const { data: preferences } = usePreferences();
  const { data: subscriptions } = useSubscriptions();
  const subscribeMutation = useSubscribe();
  const unsubscribeMutation = useUnsubscribe();

  const followedChannels = useMemo(
    () => new Set(subscriptions?.map((s) => s.channelName.toLowerCase()) ?? []),
    [subscriptions],
  );

  // "Top in Your Interests" — filtered by preferred categories
  const interestsSummaries = useMemo(() => {
    if (!communitySummaries) return [];
    if (preferences?.preferredCategories?.length) {
      const cats = preferences.preferredCategories.map((c) => c.toLowerCase());
      const filtered = communitySummaries.filter(
        (s) => s.category && cats.includes(s.category.toLowerCase()),
      );
      return filtered.length > 0 ? filtered.slice(0, 10) : communitySummaries.slice(0, 10);
    }
    return communitySummaries.slice(0, 10);
  }, [communitySummaries, preferences?.preferredCategories]);

  // "Trending Summaries" — most recent
  const trendingSummaries = useMemo(
    () => communitySummaries?.slice(0, 10) ?? [],
    [communitySummaries],
  );

  // Search results
  const isSearching = search.trim().length > 0;
  const searchResults = useMemo(() => {
    if (!isSearching || !communitySummaries) return { summaries: [] as Summary[], channels: [] as string[], categories: [] as string[] };
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
    const categories = ['Tech', 'Business', 'Science', 'Self-improvement', 'Health', 'Finance', 'Education', 'Entertainment', 'Productivity'].filter(
      (c) => c.toLowerCase().includes(q),
    );
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

  if (isLoading) {
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
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag">
      {/* Header + Search */}
      <Text style={styles.screenTitle}>Explore</Text>
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={Colors.tabIconDefault} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search summaries, channels, categories..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={Colors.tabIconDefault}
          accessibilityLabel="Search"
        />
        {isSearching && (
          <Pressable onPress={() => setSearch('')} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color={Colors.tabIconDefault} />
          </Pressable>
        )}
      </View>

      {/* Search results mode */}
      {isSearching ? (
        <View style={styles.searchResults}>
          {/* Matching channels */}
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

          {/* Matching categories */}
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

          {/* Matching summaries */}
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
          {/* Top in Your Interests */}
          <Text style={styles.sectionTitle}>Top in Your Interests</Text>
          {interestsSummaries.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
              contentContainerStyle={styles.horizontalContent}>
              {interestsSummaries.map((s) => (
                <Pressable
                  key={s.id}
                  style={styles.smallCard}
                  onPress={() => router.push(`/summary/${s.id}`)}>
                  <Image
                    source={{ uri: s.thumbnailUrl }}
                    style={styles.smallCardThumb}
                    resizeMode="cover"
                  />
                  {s.category && s.category !== 'Other' && (
                    <View style={styles.smallCardChip}>
                      <Text style={styles.smallCardChipText}>{s.category}</Text>
                    </View>
                  )}
                  <View style={styles.smallCardInfo}>
                    <Text style={styles.smallCardTitle} numberOfLines={2}>
                      {s.videoTitle}
                    </Text>
                    <Text style={styles.smallCardChannel} numberOfLines={1}>
                      {s.channelName}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>
                No summaries yet. Community content will appear here.
              </Text>
            </View>
          )}

          {/* Top Channels to Follow */}
          <Text style={styles.sectionTitle}>Top Channels to Follow</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
            contentContainerStyle={styles.horizontalContent}>
            {FEATURED_CREATORS.map((creator) => {
              const isFollowed = followedChannels.has(
                creator.name.toLowerCase(),
              );
              return (
                <View key={creator.name} style={styles.creatorCard}>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/creator/[id]',
                        params: { id: creator.name },
                      })
                    }>
                    <View style={styles.creatorAvatar}>
                      <Text style={styles.creatorInitial}>
                        {creator.name.charAt(0)}
                      </Text>
                    </View>
                  </Pressable>
                  <Text style={styles.creatorName} numberOfLines={1}>
                    {creator.name}
                  </Text>
                  <Text style={styles.creatorDesc} numberOfLines={1}>
                    {creator.description}
                  </Text>
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
          </ScrollView>

          {/* Trending Summaries */}
          <Text style={styles.sectionTitle}>Trending Summaries</Text>
          {trendingSummaries.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
              contentContainerStyle={styles.horizontalContent}>
              {trendingSummaries.map((s) => (
                <Pressable
                  key={s.id}
                  style={styles.smallCard}
                  onPress={() => router.push(`/summary/${s.id}`)}>
                  <Image
                    source={{ uri: s.thumbnailUrl }}
                    style={styles.smallCardThumb}
                    resizeMode="cover"
                  />
                  <View style={styles.smallCardInfo}>
                    <Text style={styles.smallCardTitle} numberOfLines={2}>
                      {s.videoTitle}
                    </Text>
                    <Text style={styles.smallCardChannel} numberOfLines={1}>
                      {s.channelName}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>
                No trending summaries yet.
              </Text>
            </View>
          )}

          {/* Browse Categories */}
          <Text style={styles.sectionTitle}>Browse Categories</Text>
          <CategoryGrid />
        </>
      )}

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
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  horizontalScroll: {
    marginHorizontal: -24,
    marginBottom: 16,
  },
  horizontalContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  // Small card (160px wide for carousels)
  smallCard: {
    width: 160,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  smallCardThumb: {
    width: '100%',
    height: 90,
    backgroundColor: Colors.border,
  },
  smallCardChip: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  smallCardChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  smallCardInfo: {
    padding: 8,
    gap: 3,
  },
  smallCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 17,
  },
  smallCardChannel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  // Creator cards
  creatorCard: {
    width: 120,
    alignItems: 'center',
    gap: 6,
  },
  creatorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorInitial: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
  },
  creatorName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  creatorDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  followButton: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
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
