import { View, Text, Animated, StyleSheet } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';

const STEPS = [
  { label: 'Fetching video info...', icon: 'videocam-outline' as const, duration: 3000 },
  { label: 'Downloading transcript...', icon: 'document-text-outline' as const, duration: 5000 },
  { label: 'Analyzing content...', icon: 'sparkles-outline' as const, duration: 20000 },
  { label: 'Generating summary...', icon: 'create-outline' as const, duration: 60000 },
  { label: 'Building refresher cards...', icon: 'albums-outline' as const, duration: 60000 },
  { label: 'Polishing output...', icon: 'checkmark-circle-outline' as const, duration: 120000 },
];

const TOTAL_DURATION_MS = STEPS.reduce((sum, s) => sum + s.duration, 0);

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function SummarizeProgress() {
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const startTime = useRef(Date.now());

  // Elapsed time ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startTime.current);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (currentStep >= STEPS.length) return;

    const stepProgress = (currentStep + 1) / STEPS.length;
    Animated.timing(progressAnim, {
      toValue: stepProgress,
      duration: STEPS[currentStep].duration * 0.8,
      useNativeDriver: false,
    }).start();

    if (currentStep < STEPS.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, STEPS[currentStep].duration);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const step = STEPS[Math.min(currentStep, STEPS.length - 1)];

  // Estimate remaining time from step durations
  const elapsedStepMs = STEPS.slice(0, currentStep).reduce((sum, s) => sum + s.duration, 0);
  const remainingMs = Math.max(0, TOTAL_DURATION_MS - elapsedStepMs - (elapsedMs - elapsedStepMs));
  const estLeft = remainingMs > 5000 ? formatElapsed(remainingMs) : '< 0:10';

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.iconContainer}>
        <Ionicons name={step.icon} size={24} color={Colors.primary} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>{step.label}</Text>

        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>

        <View style={styles.footer}>
          <View style={styles.steps}>
            {STEPS.map((_, i) => (
              <View key={i} style={styles.stepDot}>
                <View
                  style={[
                    styles.dot,
                    i < currentStep && styles.dotDone,
                    i === currentStep && styles.dotActive,
                  ]}
                />
              </View>
            ))}
          </View>
          <Text style={styles.timeText}>
            {formatElapsed(elapsedMs)} elapsed · ~{estLeft} left
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  steps: {
    flexDirection: 'row',
    gap: 6,
  },
  stepDot: {
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  dotDone: {
    backgroundColor: Colors.success,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 16,
  },
  timeText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
