import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useState, useMemo } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { CATEGORIES } from '@/src/types/summary';
import { useSummaries, useDeleteSummary } from '@/src/hooks/useSummary';
import { SummaryCard } from '@/src/components/summary/SummaryCard';
import { SwipeableRow } from '@/src/components/summary/SwipeableRow';
import {
  FEATURED_CREATORS,
  FEATURED_CATEGORIES,
} from '@/src/constants/featuredCreators';

export default function LibraryScreen() {
  const { data: summaries, isLoading } = useSummaries();
  const deleteMutation = useDeleteSummary();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!summaries) return [];
    let result = summaries;
    if (selectedCategory) {
      result = result.filter((s) => s.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.videoTitle.toLowerCase().includes(q) ||
          s.channelName.toLowerCase().includes(q),
      );
    }
    return result;
  }, [summaries, search, selectedCategory]);

  const filteredCreators = useMemo(() => {
    if (!selectedCategory) return FEATURED_CREATORS;
    return FEATURED_CREATORS.filter((c) => c.category === selectedCategory);
  }, [selectedCategory]);

  const hasSummaries = summaries && summaries.length > 0;

  return (
    <FlatList
      style={styles.container}
      data={filtered}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <SwipeableRow onDelete={() => deleteMutation.mutate(item.id)}>
          <SummaryCard summary={item} />
        </SwipeableRow>
      )}
      contentContainerStyle={styles.listContent}
      keyboardDismissMode="on-drag"
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Library</Text>

          {/* Search */}
          {hasSummaries && (
            <View style={styles.searchContainer}>
              <Ionicons
                name="search-outline"
                size={18}
                color={Colors.tabIconDefault}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search summaries..."
                value={search}
                onChangeText={setSearch}
                placeholderTextColor={Colors.tabIconDefault}
              />
            </View>
          )}

          {/* Category chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
            contentContainerStyle={styles.chipContainer}>
            <Pressable
              style={[styles.chip, !selectedCategory && styles.chipActive]}
              onPress={() => setSelectedCategory(null)}>
              <Text
                style={[
                  styles.chipText,
                  !selectedCategory && styles.chipTextActive,
                ]}>
                All
              </Text>
            </Pressable>
            {CATEGORIES.filter((c) => c !== 'Other').map((cat) => (
              <Pressable
                key={cat}
                style={[
                  styles.chip,
                  selectedCategory === cat && styles.chipActive,
                ]}
                onPress={() =>
                  setSelectedCategory(selectedCategory === cat ? null : cat)
                }>
                <Text
                  style={[
                    styles.chipText,
                    selectedCategory === cat && styles.chipTextActive,
                  ]}>
                  {cat}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {search.trim() && filtered.length > 0 && (
            <Text style={styles.resultCount}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </Text>
          )}

          {hasSummaries && (
            <Text style={styles.sectionLabel}>Your Summaries</Text>
          )}
        </View>
      }
      ListFooterComponent={
        <View style={styles.discoverSection}>
          <Text style={styles.sectionLabel}>Discover Creators</Text>
          <Text style={styles.discoverSubtext}>
            Summarize videos from these popular channels
          </Text>
          {filteredCreators.map((creator) => (
            <Pressable
              key={creator.name}
              style={styles.creatorRow}
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
              <View style={styles.creatorInfo}>
                <Text style={styles.creatorName}>{creator.name}</Text>
                <Text style={styles.creatorDesc}>{creator.description}</Text>
              </View>
              <Text style={styles.creatorCategory}>{creator.category}</Text>
            </Pressable>
          ))}
        </View>
      }
      ListEmptyComponent={
        isLoading ? (
          <ActivityIndicator color={Colors.primary} style={styles.loader} />
        ) : hasSummaries ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No summaries match{' '}
              {selectedCategory ? `"${selectedCategory}"` : `"${search}"`}
            </Text>
          </View>
        ) : null
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
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
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
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  chipScroll: {
    marginBottom: 16,
    marginHorizontal: -24,
  },
  chipContainer: {
    paddingHorizontal: 24,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: '#fff',
  },
  resultCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  discoverSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  discoverSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: -8,
    marginBottom: 16,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  creatorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  creatorDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  creatorCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  loader: {
    marginTop: 40,
  },
});
