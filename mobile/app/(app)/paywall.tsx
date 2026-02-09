import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { useToast } from '@/src/components/ui/Toast';

const BENEFITS = [
  {
    icon: 'sparkles-outline' as const,
    title: 'Contextual Summaries',
    description: 'Deep, structured analyses with reasoning preserved',
  },
  {
    icon: 'albums-outline' as const,
    title: 'Refresher Cards',
    description: 'Spaced repetition to retain what you learn',
  },
  {
    icon: 'people-outline' as const,
    title: 'Community Access',
    description: 'Explore analyses from thousands of learners',
  },
] as const;

export default function PaywallScreen() {
  const showToast = useToast();

  const handleStartTrial = () => {
    // TODO: Integrate with App Store subscriptions (StoreKit)
    showToast('Free trial started!');
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Close button */}
      <Pressable
        style={styles.closeBtn}
        onPress={() => router.back()}
        accessibilityLabel="Close"
        accessibilityRole="button">
        <Ionicons name="close" size={24} color={Colors.text} />
      </Pressable>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="diamond" size={40} color={Colors.primary} />
        </View>

        <Text style={styles.headline}>Unlock deep{'\n'}video insights</Text>

        {/* Benefits */}
        <View style={styles.benefits}>
          {BENEFITS.map((benefit) => (
            <View key={benefit.title} style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <Ionicons name={benefit.icon} size={22} color={Colors.primary} />
              </View>
              <View style={styles.benefitText}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>{benefit.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pricing card */}
        <View style={styles.pricingCard}>
          <Text style={styles.price}>$9</Text>
          <Text style={styles.priceUnit}>/month</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.trialButton}
          onPress={handleStartTrial}
          accessibilityLabel="Start 7-day free trial"
          accessibilityRole="button">
          <Text style={styles.trialButtonText}>Start 7-day free trial</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/mock-summary')}
          accessibilityLabel="Preview a summary"
          accessibilityRole="button">
          <Text style={styles.previewLink}>
            First, show me how summaries look like
          </Text>
        </Pressable>

        <Text style={styles.terms}>
          Cancel anytime. You won't be charged until the trial ends.
        </Text>
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
  closeBtn: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  headline: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 32,
  },
  benefits: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  benefitDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pricingCard: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 16,
  },
  price: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.text,
  },
  priceUnit: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginLeft: 4,
  },
  actions: {
    gap: 12,
    alignItems: 'center',
  },
  trialButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 18,
    width: '100%',
    alignItems: 'center',
  },
  trialButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  previewLink: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '500',
  },
  terms: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
