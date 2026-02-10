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
import { MAIN_CATEGORIES, SUBCATEGORIES, type MainCategory } from '@/src/constants/categories';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StepConfig {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}

const STEPS: StepConfig[] = [
  {
    icon: 'sparkles-outline',
    title: 'What are you\ninterested in?',
    subtitle: 'Pick topics that excite you. This helps us personalize your experience.',
  },
  {
    icon: 'grid-outline',
    title: 'Refine your\ninterests',
    subtitle: "Pick subcategories to fine-tune your feed.",
  },
];

const TOTAL_STEPS = 2;

interface PersonalizeScreenProps {
  onComplete: () => void;
}

export default function PersonalizeScreen({ onComplete }: PersonalizeScreenProps) {
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const saveMutation = useSavePreferences();

  const currentConfig = STEPS[step];

  const toggleInterest = (value: string) => {
    if (interests.includes(value)) {
      setInterests(interests.filter((v) => v !== value));
    } else {
      setInterests([...interests, value]);
    }
  };

  const toggleSubcategory = (value: string) => {
    if (subcategories.includes(value)) {
      setSubcategories(subcategories.filter((v) => v !== value));
    } else {
      setSubcategories([...subcategories, value]);
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
        goals: [],
        preferredCategories: subcategories,
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

  const renderStepContent = () => {
    if (step === 0) {
      return (
        <ScrollView
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContainer}
          showsVerticalScrollIndicator={false}>
          {MAIN_CATEGORIES.map((category) => {
            const selected = interests.includes(category);
            return (
              <Pressable
                key={category}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => toggleInterest(category)}>
                <Text
                  style={[
                    styles.chipText,
                    selected && styles.chipTextSelected,
                  ]}>
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      );
    }

    // Step 2: Subcategories grouped by selected main categories
    return (
      <ScrollView
        style={styles.chipsScroll}
        showsVerticalScrollIndicator={false}>
        {interests.map((category) => {
          const subs = SUBCATEGORIES[category as MainCategory];
          if (!subs) return null;
          return (
            <View key={category} style={styles.subcategorySection}>
              <Text style={styles.sectionTitle}>{category}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalChipsContainer}>
                {subs.map((sub) => {
                  const selected = subcategories.includes(sub);
                  return (
                    <Pressable
                      key={sub}
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => toggleSubcategory(sub)}>
                      <Text
                        style={[
                          styles.chipText,
                          selected && styles.chipTextSelected,
                        ]}>
                        {sub}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>
    );
  };

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

        {renderStepContent()}
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
  subcategorySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  horizontalChipsContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 16,
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
