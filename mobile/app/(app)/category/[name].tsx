import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useState, useMemo } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { useCommunitySummaries } from '@/src/hooks/useSummary';
import { useCategoryVideos } from '@/src/hooks/useCategoryVideos';
import { FEATURED_CREATORS } from '@/src/constants/featuredCreators';
import { VerticalVideoCard } from '@/src/components/summary/VerticalVideoCard';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function CategoryScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { data: communitySummaries, isLoading } = useCommunitySummaries();
  const [search, setSearch] = useState('');

  const categoryName = decodeURIComponent(name || '');

  const { data: categoryVideos, isLoading: isLoadingVideos } = useCategoryVideos(categoryName);

  const creatorsInCategory = useMemo(
    () => FEATURED_CREATORS.filter((c) => c.category === categoryName),
    [categoryName],
  );

  const categorySummaries = useMemo(() => {
    if (!communitySummaries) return [];
    let result = communitySummaries.filter(
      (s) => s.category?.toLowerCase() === categoryName.toLowerCase(),
    );
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.videoTitle.toLowerCase().includes(q) ||
          s.channelName.toLowerCase().includes(q),
      );
    }
    return result;
  }, [communitySummaries, categoryName, search]);

  const hasVideos = (categoryVideos?.length ?? 0) > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag">
      {/* Search within category */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={18}
          color={Colors.tabIconDefault}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search in ${categoryName}...`}
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={Colors.tabIconDefault}
          accessibilityLabel={`Search ${categoryName}`}
        />
        {search.trim().length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons
              name="close-circle"
              size={18}
              color={Colors.tabIconDefault}
            />
          </Pressable>
        )}
      </View>

      {/* 1. Channels carousel */}
      {creatorsInCategory.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>
            Channels in {categoryName}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.channelCarouselScroll}
            contentContainerStyle={styles.channelCarouselContent}>
            {creatorsInCategory.map((creator) => (
              <Pressable
                key={creator.name}
                style={styles.channelCard}
                onPress={() =>
                  router.push({
                    pathname: '/creator/[id]',
                    params: { id: creator.name },
                  })
                }
                accessibilityLabel={`View ${creator.name}`}
                accessibilityRole="button">
                <View style={styles.channelAvatar}>
                  <Text style={styles.channelInitial}>
                    {creator.name.charAt(0)}
                  </Text>
                </View>
                <Text style={styles.channelName} numberOfLines={1}>
                  {creator.name}
                </Text>
                <Text style={styles.channelDesc} numberOfLines={1}>
                  {creator.description}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      {/* 2. Latest videos in grid */}
      {isLoadingVideos && (
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
      )}
      {hasVideos && (
        <>
          <Text style={styles.sectionTitle}>Latest Videos</Text>
          <View style={styles.videoGrid}>
            {categoryVideos!.map((video) => (
              <Pressable
                key={video.videoId}
                style={styles.videoGridCard}
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
                  style={styles.videoGridThumb}
                  contentFit="cover"
                />
                {video.durationLabel ? (
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{video.durationLabel}</Text>
                  </View>
                ) : null}
                <View style={styles.videoGridInfo}>
                  <Text style={styles.videoGridTitle} numberOfLines={2}>
                    {video.title}
                  </Text>
                  <View style={styles.videoGridMeta}>
                    <Text style={styles.videoGridChannel} numberOfLines={1}>
                      {video.channelName}
                    </Text>
                    <View style={styles.summariseTag}>
                      <Ionicons name="sparkles" size={10} color="#fff" />
                      <Text style={styles.summariseTagText}>Summarise</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {/* 3. Community summaries */}
      {categorySummaries.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>
            {categorySummaries.length} summar{categorySummaries.length !== 1 ? 'ies' : 'y'}
          </Text>
          {categorySummaries.map((s) => (
            <VerticalVideoCard key={s.id} summary={s} />
          ))}
        </>
      )}

      {/* Empty state */}
      {!isLoading && !isLoadingVideos && categorySummaries.length === 0 && !hasVideos && creatorsInCategory.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons
            name="document-text-outline"
            size={48}
            color={Colors.tabIconDefault}
          />
          <Text style={styles.emptyText}>
            No content in {categoryName} yet.
          </Text>
        </View>
      )}

      {isLoading && categorySummaries.length === 0 && (
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
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
  listContent: {
    padding: 24,
    paddingBottom: 100,
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
  // Channel carousel
  channelCarouselScroll: {
    marginHorizontal: -24,
    marginBottom: 16,
  },
  channelCarouselContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  channelCard: {
    width: 120,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  channelAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  channelInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  channelName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  channelDesc: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  // Video grid
  videoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  videoGridCard: {
    width: (SCREEN_WIDTH - 24 * 2 - 12) / 2,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoGridThumb: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.border,
  },
  durationBadge: {
    position: 'absolute',
    top: (((SCREEN_WIDTH - 24 * 2 - 12) / 2) * 9) / 16 - 24,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  durationText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  videoGridInfo: {
    padding: 10,
    gap: 6,
  },
  videoGridTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 17,
  },
  videoGridMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  videoGridChannel: {
    fontSize: 11,
    color: Colors.textSecondary,
    flex: 1,
  },
  summariseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  summariseTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  loader: {
    marginTop: 20,
  },
});
