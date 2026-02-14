import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { useGenerateSummary } from '@/src/hooks/useSummary';
import { FullScreenLoader } from '@/src/components/summary/FullScreenLoader';
import { useToast } from '@/src/components/ui/Toast';
import { useRevenueCat } from '@/src/providers/RevenueCatProvider';
import { SUMMARIZE_THIS_VIDEO } from '@/src/utils/locale';

export default function ConfirmAnalyseScreen() {
  const showToast = useToast();
  const params = useLocalSearchParams<{
    videoId: string;
    title: string;
    channelName: string;
    thumbnailUrl: string;
    durationLabel?: string;
  }>();

  const generateMutation = useGenerateSummary();
  const { isPro } = useRevenueCat();

  // Estimate reading time based on duration label (rough heuristic)
  const estimatedTime = params.durationLabel
    ? `~${estimateReadingMinutes(parseDurationMinutes(params.durationLabel))} min read`
    : '~2 min read';

  const handleConfirm = () => {
    if (!params.videoId) {
      Alert.alert('Error', 'Missing video information.');
      return;
    }

    if (!isPro) {
      router.push('/paywall');
      return;
    }

    generateMutation.mutate(params.videoId, {
      onSuccess: (summary) => {
        router.replace(`/summary/${summary.id}`);
      },
      onError: (error: Error) => {
        Alert.alert('Error', error.message);
      },
    });
  };

  const isGenerating = generateMutation.isPending;

  if (isGenerating) {
    return (
      <FullScreenLoader
        thumbnailUrl={params.thumbnailUrl}
        videoTitle={params.title}
        channelName={params.channelName}
        showToast={showToast}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Thumbnail */}
        {params.thumbnailUrl ? (
          <View style={styles.thumbContainer}>
            <Image
              source={{ uri: params.thumbnailUrl }}
              style={styles.thumbnail}
              contentFit="cover"
            />
            {params.durationLabel ? (
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{params.durationLabel}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Video info */}
        <Text style={styles.title} numberOfLines={3}>
          {params.title || 'Video'}
        </Text>
        <Text style={styles.channel}>{params.channelName || 'Unknown channel'}</Text>

        {/* Meta row */}
        <View style={styles.metaRow}>
          {params.durationLabel ? (
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{params.durationLabel}</Text>
            </View>
          ) : null}
          <View style={styles.metaChip}>
            <Ionicons name="document-text-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{estimatedTime}</Text>
          </View>
        </View>

        {/* Long video warning */}
        {params.durationLabel && parseDurationMinutes(params.durationLabel) >= 240 && (
          <View style={styles.warningRow}>
            <Ionicons name="warning-outline" size={16} color={Colors.warning} />
            <Text style={styles.warningText}>
              Videos over 4 hours may fail to summarise. For best results, use videos under 4 hours.
            </Text>
          </View>
        )}
      </View>

      {/* CTA */}
      <View style={styles.actions}>
        <Pressable
          style={styles.analyseButton}
          onPress={handleConfirm}
          accessibilityLabel={SUMMARIZE_THIS_VIDEO}
          accessibilityRole="button">
          <Ionicons name="sparkles-outline" size={20} color="#fff" />
          <Text style={styles.analyseButtonText}>{SUMMARIZE_THIS_VIDEO}</Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Cancel"
          accessibilityRole="button">
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Estimate summary reading time from video duration */
function estimateReadingMinutes(minutes: number): number {
  if (minutes <= 20) return Math.max(1, Math.ceil(minutes * 0.3));
  if (minutes <= 60) return Math.ceil(5 + (minutes - 20) * 0.125); // 5–10
  if (minutes <= 120) return Math.ceil(10 + (minutes - 60) * 0.08); // 10–15
  if (minutes <= 180) return Math.ceil(15 + (minutes - 120) * 0.08); // 15–20
  return Math.min(30, Math.ceil(20 + (minutes - 180) * 0.05)); // 20–30 cap
}

/** Parse "12:34" or "1:02:30" into total minutes */
function parseDurationMinutes(label: string): number {
  const parts = label.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
  if (parts.length === 2) return parts[0] + parts[1] / 60;
  return 5;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  content: {
    flex: 1,
    gap: 12,
  },
  thumbContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.border,
    marginBottom: 8,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 28,
  },
  channel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.warning + '15',
    padding: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: Colors.warning,
    lineHeight: 18,
  },
  actions: {
    gap: 12,
    alignItems: 'center',
    paddingBottom: 20,
  },
  analyseButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 18,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  analyseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
    paddingVertical: 8,
  },
});
