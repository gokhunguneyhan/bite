import { View, Text, Pressable, Dimensions, StyleSheet } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'sparkles' as const,
    title: 'Never miss\nwhat matters',
    subtitle:
      'Contextual summaries preserve reasoning, stories, and connections — not just bullet points.',
  },
  {
    icon: 'albums' as const,
    title: 'Remember\neverything',
    subtitle:
      'Refresher cards help you retain key insights using spaced repetition, powered by science.',
  },
  {
    icon: 'people' as const,
    title: 'Learn from\nthe community',
    subtitle:
      'Discover analyses from other learners. Follow creators and channels you care about.',
  },
  {
    icon: 'time' as const,
    title: 'Your time,\nreclaimed',
    subtitle:
      'The average YouTube video is 15 minutes. A summary takes 2. Do the math.',
  },
] as const;

export default function WelcomeScreen() {
  const [step, setStep] = useState(0);
  const isLast = step === SLIDES.length - 1;
  const current = SLIDES[step];

  const handleNext = () => {
    if (isLast) {
      router.push('/register');
    } else {
      setStep(step + 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* Skip button - top right */}
      <Pressable
        style={styles.skipBtn}
        onPress={() => router.push('/login')}
        accessibilityLabel="Skip to login"
        accessibilityRole="button">
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name={current.icon} size={56} color={Colors.primary} />
        </View>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.subtitle}>{current.subtitle}</Text>
      </View>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === step && styles.dotActive]}
          />
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.primaryButton}
          onPress={handleNext}
          accessibilityLabel={isLast ? 'Get Started' : 'Next'}
          accessibilityRole="button">
          <Text style={styles.primaryButtonText}>
            {isLast ? 'Get Started' : 'Next'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push('/login')}
          accessibilityLabel="Log in"
          accessibilityRole="button">
          <Text style={styles.secondaryButtonText}>
            Already have an account? Log in
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 50,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 36,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 46,
  },
  subtitle: {
    fontSize: 17,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
    paddingHorizontal: 12,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    padding: 18,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
});
