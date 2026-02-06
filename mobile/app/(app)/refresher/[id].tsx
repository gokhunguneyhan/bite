import {
  View,
  Text,
  Pressable,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRef, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { useSummary } from '@/src/hooks/useSummary';
import type { RefresherCard } from '@/src/types/summary';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

export default function RefresherScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: summary, isLoading } = useSummary(id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [savedCards, setSavedCards] = useState<Set<string>>(new Set());
  const position = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 10,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: 0 });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeCard('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeCard('left');
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const swipeCard = (direction: 'left' | 'right') => {
    const toValue = direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;

    if (direction === 'right' && summary) {
      const card = summary.refresherCards[currentIndex];
      if (card) {
        setSavedCards((prev) => new Set(prev).add(card.id));
      }
    }

    Animated.timing(position, {
      toValue: { x: toValue, y: 0 },
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      setFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!summary) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Cards not found</Text>
      </View>
    );
  }

  const cards = summary.refresherCards;
  const isDone = currentIndex >= cards.length;
  const currentCard: RefresherCard | undefined = cards[currentIndex];

  if (isDone) {
    return (
      <View style={styles.centered}>
        <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
        <Text style={styles.doneTitle}>All done!</Text>
        <Text style={styles.doneSubtitle}>
          You saved {savedCards.size} of {cards.length} cards
        </Text>
        <Pressable
          style={styles.doneButton}
          onPress={() => router.back()}>
          <Text style={styles.doneButtonText}>Back to Summary</Text>
        </Pressable>
      </View>
    );
  }

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-8deg', '0deg', '8deg'],
  });

  const swipeLeftOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const swipeRightOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 2],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Progress */}
      <View style={styles.progress}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentIndex) / cards.length) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {cards.length}
        </Text>
      </View>

      {/* Card */}
      <View style={styles.cardArea}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [
                { translateX: position.x },
                { rotate },
              ],
            },
          ]}
          {...panResponder.panHandlers}>
          {/* Swipe indicators */}
          <Animated.View
            style={[styles.swipeLabel, styles.skipLabel, { opacity: swipeLeftOpacity }]}>
            <Text style={styles.skipLabelText}>SKIP</Text>
          </Animated.View>
          <Animated.View
            style={[styles.swipeLabel, styles.saveLabel, { opacity: swipeRightOpacity }]}>
            <Text style={styles.saveLabelText}>SAVE</Text>
          </Animated.View>

          <Pressable
            style={styles.cardContent}
            onPress={() => setFlipped(!flipped)}>
            <Text style={styles.cardSide}>
              {flipped ? 'Answer' : 'Question'}
            </Text>
            <Text style={styles.cardText}>
              {flipped ? currentCard.backText : currentCard.frontText}
            </Text>
            {!flipped && (
              <Text style={styles.tapHint}>Tap to reveal answer</Text>
            )}
          </Pressable>
        </Animated.View>
      </View>

      {/* Buttons */}
      <View style={styles.controls}>
        <Pressable
          style={styles.skipButton}
          onPress={() => swipeCard('left')}>
          <Ionicons name="close" size={28} color={Colors.textSecondary} />
        </Pressable>
        <Pressable
          style={styles.saveButton}
          onPress={() => swipeCard('right')}>
          <Ionicons name="heart" size={28} color="#fff" />
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
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 24,
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.surface,
    borderRadius: 20,
    minHeight: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  swipeLabel: {
    position: 'absolute',
    top: 20,
    zIndex: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
  },
  skipLabel: {
    left: 20,
    borderColor: Colors.error,
  },
  skipLabelText: {
    color: Colors.error,
    fontWeight: '800',
    fontSize: 16,
  },
  saveLabel: {
    right: 20,
    borderColor: Colors.success,
  },
  saveLabelText: {
    color: Colors.success,
    fontWeight: '800',
    fontSize: 16,
  },
  cardContent: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 320,
  },
  cardSide: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.tabIconDefault,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 20,
  },
  cardText: {
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '500',
  },
  tapHint: {
    fontSize: 13,
    color: Colors.tabIconDefault,
    marginTop: 24,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingVertical: 20,
  },
  skipButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
