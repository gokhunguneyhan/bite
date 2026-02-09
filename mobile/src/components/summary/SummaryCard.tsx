import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/src/constants/colors';
import type { Summary } from '@/src/types/summary';

interface SummaryCardProps {
  summary: Summary;
}

export function SummaryCard({ summary }: SummaryCardProps) {
  const timeAgo = getTimeAgo(summary.createdAt);
  const langCode = (summary.originalLanguage || summary.language || 'en').toUpperCase();

  return (
    <Pressable
      style={styles.container}
      onPress={() => router.push(`/summary/${summary.id}`)}>
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
            {summary.channelName} · {timeAgo}
          </Text>
          <Text style={styles.langBadge}>{langCode}</Text>
          {summary.category && summary.category !== 'Other' && (
            <Text style={styles.categoryBadge}>{summary.category}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function getTimeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateString).toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  thumbnail: {
    width: 120,
    height: 80,
    backgroundColor: Colors.border,
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  meta: {
    fontSize: 13,
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  langBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    backgroundColor: Colors.border,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
