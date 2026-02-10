import { View, Text, Image, Pressable, Animated, StyleSheet, Alert } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';

interface Props {
  thumbnailUrl?: string;
  videoTitle?: string;
  channelName?: string;
  showToast?: (message: string) => void;
}

const STAGES = [
  'Fetching video transcript...',
  'Analysing content with AI...',
  'Building your contextual summary...',
  'Almost done...',
];

export function FullScreenLoader({ thumbnailUrl, videoTitle, channelName, showToast }: Props) {
  const [stageIndex, setStageIndex] = useState(0);
  const [countdown, setCountdown] = useState(25);
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

  const handleAllowNotifications = () => {
    if (showToast) {
      showToast('Notifications enabled');
    } else {
      Alert.alert('Notifications enabled');
    }
  };

  return (
    <View style={styles.container}>
      {/* Video Preview - compact row at top */}
      {thumbnailUrl && (
        <View style={styles.previewSection}>
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          <View style={styles.previewInfo}>
            {videoTitle && (
              <Text style={styles.videoTitle} numberOfLines={2}>
                {videoTitle}
              </Text>
            )}
            {channelName && (
              <Text style={styles.channelName}>{channelName}</Text>
            )}
          </View>
        </View>
      )}

      {/* Centered Progress Section */}
      <View style={styles.progressWrapper}>
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
          <Text style={styles.calloutText}>
            You can close this screen, we'll let you know when your summary is ready.
          </Text>
        </View>

        {/* Allow Notifications button */}
        <Pressable
          style={styles.notificationBtn}
          onPress={handleAllowNotifications}
          accessibilityLabel="Allow notifications"
          accessibilityRole="button">
          <Ionicons name="notifications-outline" size={18} color="#fff" />
          <Text style={styles.notificationBtnText}>Allow Notifications</Text>
        </Pressable>
      </View>

      {/* Minimise button at bottom */}
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 24,
  },
  previewSection: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    gap: 12,
  },
  thumbnail: {
    width: 80,
    height: 50,
    borderRadius: 8,
    backgroundColor: Colors.border,
    marginLeft: 4,
    marginVertical: 4,
  },
  previewInfo: {
    flex: 1,
    paddingRight: 12,
    paddingVertical: 8,
    gap: 2,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
  },
  channelName: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  progressWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 24,
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
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  calloutText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  notificationBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  notificationBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
