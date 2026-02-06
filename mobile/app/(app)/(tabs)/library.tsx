import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { useSummaries } from '@/src/hooks/useSummary';
import { SummaryCard } from '@/src/components/summary/SummaryCard';

export default function LibraryScreen() {
  const { data: summaries, isLoading } = useSummaries();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!summaries) return [];
    if (!search.trim()) return summaries;
    const q = search.toLowerCase();
    return summaries.filter(
      (s) =>
        s.videoTitle.toLowerCase().includes(q) ||
        s.channelName.toLowerCase().includes(q),
    );
  }, [summaries, search]);

  return (
    <FlatList
      style={styles.container}
      data={filtered}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <SummaryCard summary={item} />}
      contentContainerStyle={styles.listContent}
      keyboardDismissMode="on-drag"
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Your Library</Text>
          {summaries && summaries.length > 0 && (
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
          {search.trim() && filtered.length > 0 && (
            <Text style={styles.resultCount}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
      }
      ListEmptyComponent={
        isLoading ? (
          <ActivityIndicator
            color={Colors.primary}
            style={styles.loader}
          />
        ) : search.trim() ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No summaries match "{search}"
            </Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="library-outline"
              size={48}
              color={Colors.tabIconDefault}
            />
            <Text style={styles.emptyTitle}>No summaries yet</Text>
            <Text style={styles.emptyText}>
              Summaries you generate will appear here. Head to the Home tab to
              get started.
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
  header: {
    marginBottom: 16,
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
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  resultCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
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
