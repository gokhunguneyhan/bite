import { View, Text, Animated, StyleSheet } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';

const STEPS = [
  { label: 'Fetching video info...', icon: 'videocam-outline' as const, duration: 2000 },
  { label: 'Downloading transcript...', icon: 'document-text-outline' as const, duration: 3000 },
  { label: 'Analyzing content...', icon: 'sparkles-outline' as const, duration: 5000 },
  { label: 'Generating summary...', icon: 'create-outline' as const, duration: 10000 },
];

export function SummarizeProgress() {
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (currentStep >= STEPS.length) return;

    // Animate progress bar for current step
    const stepProgress = (currentStep + 1) / STEPS.length;
    Animated.timing(progressAnim, {
      toValue: stepProgress,
      duration: STEPS[currentStep].duration * 0.8,
      useNativeDriver: false,
    }).start();

    // Move to next step after duration
    if (currentStep < STEPS.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, STEPS[currentStep].duration);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const step = STEPS[Math.min(currentStep, STEPS.length - 1)];

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

        <View style={styles.steps}>
          {STEPS.map((s, i) => (
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
});
