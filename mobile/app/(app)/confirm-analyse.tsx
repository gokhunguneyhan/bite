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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/src/constants/colors';
import { useGenerateSummary } from '@/src/hooks/useSummary';
import { FullScreenLoader } from '@/src/components/summary/FullScreenLoader';
import { useToast } from '@/src/components/ui/Toast';
import { useSettingsStore } from '@/src/stores/settingsStore';

export default function ConfirmAnalyseScreen() {
  const insets = useSafeAreaInsets();
  const showToast = useToast();
  const params = useLocalSearchParams<{
    videoId: string;
    title: string;
    channelName: string;
    thumbnailUrl: string;
    durationLabel?: string;
  }>();

  const generateMutation = useGenerateSummary();
  const { selectedTier, trialStarted } = useSettingsStore();

  // Estimate reading time based on duration label (rough heuristic)
  const estimatedTime = params.durationLabel
    ? `~${Math.max(1, Math.ceil(parseDurationMinutes(params.durationLabel) * 0.3))} min read`
    : '~2 min read';

  const handleConfirm = () => {
    if (!params.videoId) {
      Alert.alert('Error', 'Missing video information.');
      return;
    }

    if (selectedTier === 'free' && !trialStarted) {
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Close button */}
      <Pressable
        style={styles.closeBtn}
        onPress={() => router.back()}
        accessibilityLabel="Go back"
        accessibilityRole="button">
        <Ionicons name="arrow-back" size={24} color={Colors.text} />
      </Pressable>

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
      </View>

      {/* CTA */}
      <View style={styles.actions}>
        <Pressable
          style={styles.analyseButton}
          onPress={handleConfirm}
          accessibilityLabel="Confirm and analyse this video"
          accessibilityRole="button">
          <Ionicons name="sparkles-outline" size={20} color="#fff" />
          <Text style={styles.analyseButtonText}>Analyse this video</Text>
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
