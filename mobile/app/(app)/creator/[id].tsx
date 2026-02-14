import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { SUMMARIZE } from '@/src/utils/locale';
import {
  useChannelSummaries,
  useIsSubscribed,
  useSubscribe,
  useUnsubscribe,
} from '@/src/hooks/useSummary';
import { SummaryCard } from '@/src/components/summary/SummaryCard';
import { useChannelInfo } from '@/src/hooks/useChannelInfo';
import { getChannelLatestVideos } from '@/src/services/youtubeImportService';
import type { YouTubeVideo } from '@/src/mocks/youtubeSubscriptions';

export default function CreatorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const channelName = decodeURIComponent(id);
  const { data: summaries, isLoading } = useChannelSummaries(channelName);
  const { data: subscribed } = useIsSubscribed(channelName);
  const subscribeMutation = useSubscribe();
  const unsubscribeMutation = useUnsubscribe();

  const { data: channelInfo } = useChannelInfo(channelName);
  const isFollowing = subscribed === true;
  const isMutating = subscribeMutation.isPending || unsubscribeMutation.isPending;

  // Get latest videos for this channel (mock data)
  const latestVideos = useMemo(
    () => getChannelLatestVideos(channelName),
    [channelName],
  );

  // Videos that haven't been analysed yet
  const analysedVideoIds = useMemo(
    () => new Set(summaries?.map((s) => s.videoId) ?? []),
    [summaries],
  );
  const unanalysedVideos = useMemo(
    () => latestVideos.filter((v) => !analysedVideoIds.has(v.videoId)),
    [latestVideos, analysedVideoIds],
  );

  const handleToggleFollow = () => {
    if (isMutating) return;
    if (isFollowing) {
      unsubscribeMutation.mutate(channelName);
    } else {
      subscribeMutation.mutate(channelName);
    }
  };

  const initial = channelName?.charAt(0)?.toUpperCase() ?? 'C';
  const count = summaries?.length ?? 0;

  const renderVideoCard = ({ item }: { item: YouTubeVideo }) => (
    <Pressable
      style={styles.videoCard}
      onPress={() =>
        router.push({
          pathname: '/analyse',
          params: { url: `https://youtube.com/watch?v=${item.videoId}` },
        })
      }
      accessibilityLabel={`${SUMMARIZE} ${item.title}`}
      accessibilityRole="button">
      <Image
        source={{ uri: item.thumbnailUrl }}
        style={styles.videoThumb}
        contentFit="cover"
      />
      <View style={styles.videoDuration}>
        <Text style={styles.videoDurationText}>{item.durationLabel}</Text>
      </View>
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.videoMeta}>
          {getTimeAgo(item.publishedAt)}
        </Text>
      </View>
      <View style={styles.analyseTag}>
        <Ionicons name="sparkles-outline" size={14} color={Colors.primary} />
        <Text style={styles.analyseTagText}>{SUMMARIZE}</Text>
      </View>
    </Pressable>
  );

  const header = (
    <View>
      <View style={styles.header}>
        {channelInfo?.avatarUrl ? (
          <Image source={{ uri: channelInfo.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}
        <Text style={styles.name}>{channelName}</Text>
        <Text style={styles.stats}>
          {count} {count === 1 ? 'summary' : 'summaries'}
        </Text>
        <Pressable
          style={[
            styles.followButton,
            isFollowing && styles.followButtonActive,
          ]}
          onPress={handleToggleFollow}
          disabled={isMutating}
          accessibilityLabel={isFollowing ? `Unfollow ${channelName}` : `Follow ${channelName}`}
          accessibilityRole="button">
          <Ionicons
            name={isFollowing ? 'checkmark' : 'add'}
            size={16}
            color={isFollowing ? '#fff' : Colors.primary}
          />
          <Text
            style={[
              styles.followButtonText,
              isFollowing && styles.followButtonTextActive,
            ]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </Pressable>
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

      {/* Latest videos (unanalysed) */}
      {unanalysedVideos.length > 0 && (
        <View style={styles.latestSection}>
          <Text style={styles.sectionTitle}>Latest Videos</Text>
          <Text style={styles.sectionSubtitle}>
            Tap a video to {SUMMARIZE.toLowerCase()} it
          </Text>
          <FlatList
            data={unanalysedVideos}
            keyExtractor={(item) => item.videoId}
            renderItem={renderVideoCard}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.videosScroll}
          />
        </View>
      )}

      {/* Summaries header */}
      {count > 0 && (
        <Text style={styles.sectionTitle}>Analysed Videos</Text>
      )}
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      data={summaries}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <SummaryCard summary={item} />}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={header}
      ListEmptyComponent={
        isLoading ? (
          <ActivityIndicator color={Colors.primary} style={styles.loader} />
        ) : unanalysedVideos.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="videocam-outline" size={40} color={Colors.border} />
            <Text style={styles.emptyText}>
              No summaries from this creator yet. Paste one of their video URLs
              to get started.
            </Text>
          </View>
        ) : null
      }
    />
  );
}

function getTimeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return new Date(dateString).toLocaleDateString();
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
    marginBottom: 12,
  },
  avatarFallback: {
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
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
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  followButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  followButtonTextActive: {
    color: '#fff',
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
  // Latest videos section
  latestSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  videosScroll: {
    gap: 12,
  },
  videoCard: {
    width: 240,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoThumb: {
    width: '100%',
    height: 135,
    backgroundColor: Colors.border,
  },
  videoDuration: {
    position: 'absolute',
    top: 110,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  videoDurationText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  videoInfo: {
    padding: 10,
    gap: 4,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 19,
  },
  videoMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  analyseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  analyseTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 16,
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
