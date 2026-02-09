import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Animated as RNAnimated,
} from 'react-native';
import { useState, useRef, useCallback } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { useDueCards, useReviewCard } from '@/src/hooks/useSpacedRepetition';
import type { DueCard } from '@/src/services/spacedRepetitionService';

type Quality = 0 | 1 | 2 | 3 | 4 | 5;

export default function ReviewScreen() {
  const { data: dueCards, isLoading } = useDueCards();
  const reviewMutation = useReviewCard();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const flipAnim = useRef(new RNAnimated.Value(0)).current;

  const cards = dueCards ?? [];
  const currentCard: DueCard | undefined = cards[currentIndex];
  const isDone = currentIndex >= cards.length;

  const flipToFront = useCallback(() => {
    RNAnimated.spring(flipAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 10,
    }).start();
  }, [flipAnim]);

  const flipToBack = useCallback(() => {
    RNAnimated.spring(flipAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 10,
    }).start();
  }, [flipAnim]);

  const handleFlip = () => {
    if (flipped) {
      flipToFront();
    } else {
      flipToBack();
    }
    setFlipped(!flipped);
  };

  const handleRate = (quality: Quality) => {
    if (!currentCard) return;

    reviewMutation.mutate(
      {
        summaryId: currentCard.summaryId,
        cardId: currentCard.cardId,
        quality,
      },
      {
        onSettled: () => {
          setReviewedCount((prev) => prev + 1);
          setFlipped(false);
          flipAnim.setValue(0);
          setCurrentIndex((prev) => prev + 1);
        },
      },
    );
  };

  // Earliest next review date for the completion screen
  const getEarliestNextReview = (): string => {
    if (!cards.length) return 'soon';
    const dates = cards.map((c) => new Date(c.nextReviewAt));
    const earliest = new Date(Math.min(...dates.map((d) => d.getTime())));
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    if (earliest < tomorrow) return 'tomorrow';
    return earliest.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (cards.length === 0 && !isDone) {
    return (
      <View style={styles.centered}>
        <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
        <Text style={styles.doneTitle}>No cards due</Text>
        <Text style={styles.doneSubtitle}>
          All caught up! Check back later.
        </Text>
        <Pressable style={styles.doneButton} onPress={() => router.back()}>
          <Text style={styles.doneButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  if (isDone) {
    return (
      <View style={styles.centered}>
        <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
        <Text style={styles.doneTitle}>Session complete!</Text>
        <Text style={styles.doneSubtitle}>
          You reviewed {reviewedCount} card{reviewedCount !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.nextReview}>
          Next review: {getEarliestNextReview()}
        </Text>
        <Pressable style={styles.doneButton} onPress={() => router.back()}>
          <Text style={styles.doneButtonText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  // Flip animation interpolations
  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <View style={styles.container}>
      {/* Progress */}
      <View style={styles.progress}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(currentIndex / cards.length) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {cards.length}
        </Text>
      </View>

      {/* Card */}
      <Pressable style={styles.cardArea} onPress={handleFlip}>
        {/* Front side */}
        <RNAnimated.View
          style={[
            styles.card,
            styles.cardFront,
            {
              opacity: frontOpacity,
              transform: [{ perspective: 1000 }, { rotateY: frontRotate }],
            },
          ]}
        >
          <View style={styles.cardContent}>
            <Ionicons
              name="bulb-outline"
              size={32}
              color={Colors.primary}
              style={styles.cardIcon}
            />
            <Text style={styles.cardTitle}>{currentCard.title}</Text>
            <Text style={styles.videoTitle}>{currentCard.videoTitle}</Text>
            <Text style={styles.tapHint}>Tap to reveal answer</Text>
          </View>
        </RNAnimated.View>

        {/* Back side */}
        <RNAnimated.View
          style={[
            styles.card,
            styles.cardBack,
            {
              opacity: backOpacity,
              transform: [{ perspective: 1000 }, { rotateY: backRotate }],
            },
          ]}
        >
          <ScrollView
            style={styles.cardScroll}
            contentContainerStyle={styles.cardScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.backTitle}>{currentCard.title}</Text>
            <Text style={styles.backExplanation}>
              {currentCard.explanation}
            </Text>
          </ScrollView>
        </RNAnimated.View>
      </Pressable>

      {/* Rating buttons (only visible when flipped) */}
      {flipped && (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingLabel}>How well did you know this?</Text>
          <View style={styles.ratingButtons}>
            <Pressable
              style={[styles.ratingButton, styles.ratingAgain]}
              onPress={() => handleRate(0)}
              disabled={reviewMutation.isPending}
            >
              <Text style={styles.ratingButtonText}>Again</Text>
            </Pressable>
            <Pressable
              style={[styles.ratingButton, styles.ratingHard]}
              onPress={() => handleRate(3)}
              disabled={reviewMutation.isPending}
            >
              <Text style={styles.ratingButtonText}>Hard</Text>
            </Pressable>
            <Pressable
              style={[styles.ratingButton, styles.ratingGood]}
              onPress={() => handleRate(4)}
              disabled={reviewMutation.isPending}
            >
              <Text style={styles.ratingButtonText}>Good</Text>
            </Pressable>
            <Pressable
              style={[styles.ratingButton, styles.ratingEasy]}
              onPress={() => handleRate(5)}
              disabled={reviewMutation.isPending}
            >
              <Text style={styles.ratingButtonText}>Easy</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Tap hint when not flipped */}
      {!flipped && (
        <View style={styles.hintContainer}>
          <Ionicons
            name="hand-left-outline"
            size={18}
            color={Colors.textSecondary}
          />
          <Text style={styles.hintText}>Tap card to flip</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 24,
    gap: 12,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    fontFamily: 'SpaceMono',
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '5%',
    bottom: '5%',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBack: {},
  cardContent: {
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 12,
  },
  videoTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  tapHint: {
    fontSize: 13,
    color: Colors.tabIconDefault,
    marginTop: 24,
    fontStyle: 'italic',
  },
  cardScroll: {
    borderRadius: 20,
  },
  cardScrollContent: {
    padding: 28,
  },
  backTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
    lineHeight: 24,
  },
  backExplanation: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 26,
  },
  ratingContainer: {
    paddingVertical: 16,
    gap: 12,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  ratingAgain: {
    backgroundColor: Colors.error,
  },
  ratingHard: {
    backgroundColor: Colors.warning,
  },
  ratingGood: {
    backgroundColor: Colors.success,
  },
  ratingEasy: {
    backgroundColor: '#3B82F6',
  },
  hintContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 20,
  },
  hintText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  doneTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  doneSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  nextReview: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  doneButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    marginTop: 12,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
