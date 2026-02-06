import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { useChannelSummaries } from '@/src/hooks/useSummary';
import { SummaryCard } from '@/src/components/summary/SummaryCard';

export default function CreatorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const channelName = decodeURIComponent(id);
  const { data: summaries, isLoading } = useChannelSummaries(channelName);

  const initial = channelName?.charAt(0)?.toUpperCase() ?? 'C';
  const count = summaries?.length ?? 0;

  return (
    <FlatList
      style={styles.container}
      data={summaries}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <SummaryCard summary={item} />}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{channelName}</Text>
          <Text style={styles.stats}>
            {count} {count === 1 ? 'summary' : 'summaries'}
          </Text>
          <View style={styles.badges}>
            <View style={styles.badge}>
              <Ionicons
                name="videocam-outline"
                size={14}
                color={Colors.textSecondary}
              />
              <Text style={styles.badgeText}>YouTube Creator</Text>
            </View>
          </View>
        </View>
      }
      ListEmptyComponent={
        isLoading ? (
          <ActivityIndicator color={Colors.primary} style={styles.loader} />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No summaries from this creator yet. Summarize one of their videos
              to see it here.
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
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  stats: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  badges: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 16,
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
