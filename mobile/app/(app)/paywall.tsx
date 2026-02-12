import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/src/constants/colors';
import { useRevenueCat } from '@/src/providers/RevenueCatProvider';

export default function PaywallScreen() {
  const { isReady, showPaywall } = useRevenueCat();

  useEffect(() => {
    if (!isReady) return;

    showPaywall().finally(() => {
      if (router.canGoBack()) {
        router.back();
      }
    });
  }, [isReady]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.text}>Loading subscription options...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  text: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
