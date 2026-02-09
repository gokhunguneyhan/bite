import { View, Text, Image, Pressable, Animated, StyleSheet } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';

interface Props {
  thumbnailUrl?: string;
  videoTitle?: string;
  channelName?: string;
}

const STAGES = [
  'Fetching video transcript...',
  'Analysing content with AI...',
  'Building your contextual summary...',
  'Almost done...',
];

export function FullScreenLoader({ thumbnailUrl, videoTitle, channelName }: Props) {
  const [stageIndex, setStageIndex] = useState(0);
  const [countdown, setCountdown] = useState(30);
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  // Pulse animation
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // Stage progression
  useEffect(() => {
    const durations = [5000, 10000, 12000, 60000];
    if (stageIndex >= STAGES.length - 1) return;

    const timer = setTimeout(() => {
      setStageIndex((prev) => Math.min(prev + 1, STAGES.length - 1));
    }, durations[stageIndex]);

    return () => clearTimeout(timer);
  }, [stageIndex]);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {/* Video Preview */}
      {thumbnailUrl && (
        <View style={styles.previewSection}>
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          {videoTitle && (
            <Text style={styles.videoTitle} numberOfLines={2}>
              {videoTitle}
            </Text>
          )}
          {channelName && (
            <Text style={styles.channelName}>{channelName}</Text>
          )}
        </View>
      )}

      {/* Animated Progress */}
      <View style={styles.progressSection}>
        <Animated.View style={[styles.pulseCircle, { opacity: pulseAnim }]}>
          <Ionicons name="sparkles" size={32} color={Colors.primary} />
        </Animated.View>

        <Text style={styles.stageText}>{STAGES[stageIndex]}</Text>

        {/* Progress dots */}
        <View style={styles.dots}>
          {STAGES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < stageIndex && styles.dotDone,
                i === stageIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <Text style={styles.countdown}>
          {countdown > 0
            ? `~${countdown} seconds remaining`
            : 'Finishing up...'}
        </Text>
      </View>

      {/* Notification callout */}
      <View style={styles.callout}>
        <Ionicons
          name="notifications-outline"
          size={20}
          color={Colors.textSecondary}
        />
        <Text style={styles.calloutText}>
          This screen can be minimised. We'll let you know when your summary is
          ready.
        </Text>
      </View>

      {/* Minimise button */}
      <Pressable
        style={styles.minimiseBtn}
        onPress={() => router.back()}
        accessibilityLabel="Minimise and return to feed"
        accessibilityRole="button">
        <Text style={styles.minimiseText}>Minimise</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 24,
  },
  previewSection: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  thumbnail: {
    width: '80%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: Colors.border,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  channelName: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  progressSection: {
    alignItems: 'center',
    gap: 16,
  },
  pulseCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotDone: {
    backgroundColor: Colors.success,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 20,
  },
  countdown: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  callout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    width: '100%',
  },
  calloutText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  minimiseBtn: {
    paddingVertical: 12,
  },
  minimiseText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
