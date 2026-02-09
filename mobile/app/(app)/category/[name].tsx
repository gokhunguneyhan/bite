import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useState, useMemo } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { useCommunitySummaries } from '@/src/hooks/useSummary';
import { FEATURED_CREATORS } from '@/src/constants/featuredCreators';
import { VerticalVideoCard } from '@/src/components/summary/VerticalVideoCard';

export default function CategoryScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { data: communitySummaries, isLoading } = useCommunitySummaries();
  const [search, setSearch] = useState('');

  const categoryName = decodeURIComponent(name || '');

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

  return (
    <FlatList
      style={styles.container}
      data={categorySummaries}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <VerticalVideoCard summary={item} />}
      contentContainerStyle={styles.listContent}
      keyboardDismissMode="on-drag"
      ListHeaderComponent={
        <View>
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

          {/* Popular channels in category */}
          {creatorsInCategory.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>
                Popular channels in {categoryName}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScroll}
                contentContainerStyle={styles.horizontalContent}>
                {creatorsInCategory.map((creator) => (
                  <Pressable
                    key={creator.name}
                    style={styles.creatorChip}
                    onPress={() =>
                      router.push({
                        pathname: '/creator/[id]',
                        params: { id: creator.name },
                      })
                    }
                    accessibilityLabel={`View ${creator.name}`}
                    accessibilityRole="button">
                    <View style={styles.creatorAvatar}>
                      <Text style={styles.creatorInitial}>
                        {creator.name.charAt(0)}
                      </Text>
                    </View>
                    <Text style={styles.creatorName} numberOfLines={1}>
                      {creator.name}
                    </Text>
                    <Text style={styles.creatorDesc} numberOfLines={1}>
                      {creator.description}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}

          {/* Summaries count */}
          <Text style={styles.sectionTitle}>
            {categorySummaries.length > 0
              ? `${categorySummaries.length} summar${categorySummaries.length !== 1 ? 'ies' : 'y'}`
              : 'Summaries'}
          </Text>
        </View>
      }
      ListEmptyComponent={
        isLoading ? (
          <ActivityIndicator color={Colors.primary} style={styles.loader} />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="document-text-outline"
              size={48}
              color={Colors.tabIconDefault}
            />
            <Text style={styles.emptyText}>
              No community summaries in {categoryName} yet.
            </Text>
          </View>
        )
      }
    />
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
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  horizontalScroll: {
    marginHorizontal: -24,
    marginBottom: 20,
  },
  horizontalContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  creatorChip: {
    alignItems: 'center',
    width: 100,
    gap: 4,
  },
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  creatorName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  creatorDesc: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
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
    marginTop: 40,
  },
});
