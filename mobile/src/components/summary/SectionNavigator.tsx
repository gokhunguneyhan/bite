import { useRef, useEffect } from 'react';
import { ScrollView, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { Colors } from '@/src/constants/colors';

const PILLS = [
  { key: 'intro', label: 'Intro' },
  { key: 'summary', label: 'Summary' },
  { key: 'insights', label: 'Insights' },
  { key: 'resources', label: 'Resources' },
  { key: 'more', label: 'More' },
] as const;

export type SectionKey = (typeof PILLS)[number]['key'];

interface Props {
  activeSection: SectionKey;
  onPress: (key: SectionKey) => void;
  visible?: boolean;
}

export function SectionNavigator({ activeSection, onPress, visible = true }: Props) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : -60,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, translateY]);

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ translateY }] }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}>
        {PILLS.map((pill) => {
          const isActive = activeSection === pill.key;
          return (
            <Pressable
              key={pill.key}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => onPress(pill.key)}
              accessibilityLabel={`Scroll to ${pill.label}`}
              accessibilityRole="button">
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {pill.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: Colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  container: {
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  pillActive: {
    backgroundColor: Colors.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: '#fff',
  },
});
