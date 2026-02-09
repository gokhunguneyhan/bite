import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/src/constants/colors';
import type { Summary } from '@/src/types/summary';

interface VerticalVideoCardProps {
  summary: Summary;
}

function getRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
  return new Date(dateString).toLocaleDateString();
}

export function VerticalVideoCard({ summary }: VerticalVideoCardProps) {
  const relativeTime = getRelativeTime(summary.createdAt);

  return (
    <Pressable
      style={styles.container}
      onPress={() => router.push(`/summary/${summary.id}`)}
    >
      <Image
        source={{ uri: summary.thumbnailUrl }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {summary.videoTitle}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta} numberOfLines={1}>
            {summary.channelName}
          </Text>
          <Text style={styles.metaDot}> · </Text>
          <Text style={styles.meta}>{relativeTime}</Text>
        </View>
        {summary.category && summary.category !== 'Other' && (
          <View style={styles.chipRow}>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{summary.category}</Text>
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.border,
  },
  content: {
    padding: 12,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meta: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  metaDot: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  chipRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  categoryChip: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
});
