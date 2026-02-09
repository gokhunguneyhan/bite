import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useMemo } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { useSummaries } from '@/src/hooks/useSummary';
import { usePreferences } from '@/src/hooks/usePreferences';
import { useDueCards } from '@/src/hooks/useSpacedRepetition';
import { SummaryCard } from '@/src/components/summary/SummaryCard';

export default function HomeScreen() {
  const { data: summaries, isLoading } = useSummaries();
  const { data: preferences } = usePreferences();
  const { data: dueCards } = useDueCards();
  const dueCount = dueCards?.length ?? 0;

  const forYouSummaries = useMemo(() => {
    if (!summaries || !preferences?.preferredCategories?.length) return [];
    const cats = preferences.preferredCategories.map((c) => c.toLowerCase());
    return summaries.filter(
      (s) => s.category && cats.includes(s.category.toLowerCase()),
    );
  }, [summaries, preferences?.preferredCategories]);

  return (
    <FlatList
      style={styles.container}
      data={summaries}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <SummaryCard summary={item} />}
      contentContainerStyle={styles.listContent}
      keyboardDismissMode="on-drag"
      ListHeaderComponent={
        <View style={styles.header}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <Pressable
              style={styles.addButton}
              onPress={() => router.push('/analyse')}
              accessibilityLabel="Analyse a new video"
              accessibilityRole="button">
              <Ionicons name="add" size={24} color="#fff" />
            </Pressable>
            <Text style={styles.appTitle}>YT Summarise</Text>
            <Pressable
              style={styles.bellButton}
              accessibilityLabel="Notifications"
              accessibilityRole="button">
              <Ionicons
                name="notifications-outline"
                size={22}
                color={Colors.text}
              />
            </Pressable>
          </View>

          {/* Due cards banner */}
          {dueCount > 0 && (
            <Pressable
              style={styles.dueBanner}
              onPress={() => router.push('/review')}>
              <View style={styles.dueBannerLeft}>
                <Ionicons name="time" size={20} color="#fff" />
                <Text style={styles.dueBannerText}>
                  {dueCount} card{dueCount !== 1 ? 's' : ''} ready for review
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </Pressable>
          )}

          {/* For you section */}
          {forYouSummaries.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Based on your interests</Text>
              {forYouSummaries.slice(0, 3).map((item) => (
                <SummaryCard key={item.id} summary={item} />
              ))}
            </View>
          )}

          {summaries && summaries.length > 0 && (
            <Text style={styles.sectionTitle}>Recent Summaries</Text>
          )}
        </View>
      }
      ListEmptyComponent={
        isLoading ? (
          <ActivityIndicator color={Colors.primary} style={styles.loader} />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="videocam-outline"
              size={48}
              color={Colors.tabIconDefault}
            />
            <Text style={styles.emptyTitle}>No summaries yet</Text>
            <Text style={styles.emptyText}>
              Tap the + button above to analyse your first YouTube video.
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
    paddingTop: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  dueBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dueBannerText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
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
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  loader: {
    marginTop: 40,
  },
});
