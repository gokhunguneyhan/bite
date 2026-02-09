import { useEffect, useRef } from 'react';
import { Text, Animated, StyleSheet } from 'react-native';
import { useToastStore } from '@/src/stores/toastStore';

export function Toast() {
  const message = useToastStore((s) => s.message);
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (message) {
      // Slide up and fade in
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // After 1.5s, fade out
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 80,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      // Reset position immediately when message clears
      translateY.setValue(80);
      opacity.setValue(0);
    }
  }, [message]);

  if (!message) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

export function useToast() {
  return useToastStore((s) => s.show);
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    alignSelf: 'center',
    zIndex: 9999,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
});
