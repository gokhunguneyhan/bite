import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { useSavePreferences } from '@/src/hooks/usePreferences';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const INTEREST_OPTIONS = [
  'Technology',
  'Business',
  'Finance',
  'Science',
  'Health',
  'Self-improvement',
  'Productivity',
  'Education',
  'Entertainment',
  'Politics',
  'Sports',
  'Cooking',
  'Travel',
  'Art & Design',
  'Music',
];

const GOAL_OPTIONS = [
  'Learn new skills',
  'Stay informed',
  'Career growth',
  'Personal development',
  'Entertainment',
  'Research',
  'Save time on long videos',
  'Build better habits',
];

const CATEGORY_OPTIONS = [
  'Tech',
  'Business',
  'Science',
  'Self-improvement',
  'Health',
  'Finance',
  'Education',
  'Entertainment',
  'Productivity',
];

interface StepConfig {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  options: string[];
}

const STEPS: StepConfig[] = [
  {
    icon: 'sparkles-outline',
    title: 'What are you\ninterested in?',
    subtitle: 'Pick topics that excite you. This helps us personalize your experience.',
    options: INTEREST_OPTIONS,
  },
  {
    icon: 'rocket-outline',
    title: "What are\nyour goals?",
    subtitle: 'Tell us what you want to achieve with video summaries.',
    options: GOAL_OPTIONS,
  },
  {
    icon: 'grid-outline',
    title: 'Pick your favorite\ncategories',
    subtitle: "We'll highlight summaries that match your preferences.",
    options: CATEGORY_OPTIONS,
  },
];

const TOTAL_STEPS = STEPS.length;

interface PersonalizeScreenProps {
  onComplete: () => void;
}

export default function PersonalizeScreen({ onComplete }: PersonalizeScreenProps) {
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const saveMutation = useSavePreferences();

  const selections = [interests, goals, categories];
  const setters = [setInterests, setGoals, setCategories];

  const currentSelections = selections[step];
  const currentConfig = STEPS[step];

  const toggleChip = (value: string) => {
    const setter = setters[step];
    const current = selections[step];
    if (current.includes(value)) {
      setter(current.filter((v) => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  const animateToStep = (nextStep: number) => {
    const direction = nextStep > step ? 1 : -1;
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: -direction * SCREEN_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: direction * SCREEN_WIDTH,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    setStep(nextStep);
  };

  const handleContinue = () => {
    if (step < TOTAL_STEPS - 1) {
      animateToStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    if (step < TOTAL_STEPS - 1) {
      animateToStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    saveMutation.mutate(
      {
        interests,
        goals,
        preferredCategories: categories,
      },
      {
        onSuccess: () => {
          onComplete();
        },
        onError: (error: Error) => {
          Alert.alert('Error', error.message);
        },
      },
    );
  };

  const isLast = step === TOTAL_STEPS - 1;
  const isSaving = saveMutation.isPending;

  return (
    <View style={styles.container}>
      {/* Progress Dots */}
      <View style={styles.progressContainer}>
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]}
            />
          ))}
        </View>
        <Text style={styles.stepLabel}>
          {step + 1} of {TOTAL_STEPS}
        </Text>
      </View>

      {/* Animated Content */}
      <Animated.View
        style={[
          styles.content,
          { transform: [{ translateX: slideAnim }] },
        ]}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={currentConfig.icon}
            size={40}
            color={Colors.primary}
          />
        </View>

        <Text style={styles.title}>{currentConfig.title}</Text>
        <Text style={styles.subtitle}>{currentConfig.subtitle}</Text>

        <ScrollView
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContainer}
          showsVerticalScrollIndicator={false}>
          {currentConfig.options.map((option) => {
            const selected = currentSelections.includes(option);
            return (
              <Pressable
                key={option}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => toggleChip(option)}>
                <Text
                  style={[
                    styles.chipText,
                    selected && styles.chipTextSelected,
                  ]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.primaryButton, isSaving && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {isLast ? 'Finish' : 'Continue'}
            </Text>
          )}
        </Pressable>

        <Pressable style={styles.skipButton} onPress={handleSkip} disabled={isSaving}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
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
  dotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  dotDone: {
    backgroundColor: Colors.primary + '60',
  },
  stepLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
    lineHeight: 22,
    marginBottom: 24,
  },
  chipsScroll: {
    flex: 1,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 16,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  chipTextSelected: {
    color: '#fff',
  },
  actions: {
    gap: 12,
    paddingTop: 12,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    padding: 12,
    alignItems: 'center',
  },
  skipText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
});
