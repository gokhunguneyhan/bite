import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { useToast } from '@/src/components/ui/Toast';
import {
  useSettingsStore,
  type Tier,
  type BillingCycle,
} from '@/src/stores/settingsStore';

// ---------------------------------------------------------------------------
// Pricing data
// ---------------------------------------------------------------------------

const PRICING: Record<
  Tier,
  { monthly: number; annual: number; dailyMonthly: string; dailyAnnual: string }
> = {
  free: { monthly: 0, annual: 0, dailyMonthly: '$0', dailyAnnual: '$0' },
  pro: {
    monthly: 9.99,
    annual: 99.99,
    dailyMonthly: '$0.33/day',
    dailyAnnual: '$0.27/day',
  },
  power: {
    monthly: 19.99,
    annual: 199.99,
    dailyMonthly: '$0.66/day',
    dailyAnnual: '$0.55/day',
  },
};

interface TierInfo {
  key: Tier;
  name: string;
  tagline: string;
  badge?: string;
  badgeColor?: string;
  limits: { hours: string; translations: string; retention: string };
  cta: string;
}

const TIERS: TierInfo[] = [
  {
    key: 'free',
    name: 'Free',
    tagline: 'Get started',
    limits: { hours: '2 hrs/mo', translations: '2/mo', retention: '30 days' },
    cta: 'Get Started',
  },
  {
    key: 'pro',
    name: 'Pro',
    tagline: 'For regular learners',
    badge: 'Most Popular',
    badgeColor: Colors.warning,
    limits: { hours: '10 hrs/mo', translations: '10/mo', retention: '6 months' },
    cta: 'Start 7-day free trial',
  },
  {
    key: 'power',
    name: 'Power',
    tagline: 'For power users',
    limits: { hours: '20 hrs/mo', translations: '20/mo', retention: 'Forever' },
    cta: 'Start 7-day free trial',
  },
];

// ---------------------------------------------------------------------------
// Feature comparison rows
// ---------------------------------------------------------------------------

type CellValue = true | false | string;

interface FeatureRow {
  label: string;
  free: CellValue;
  pro: CellValue;
  power: CellValue;
}

interface FeatureSection {
  title: string;
  rows: FeatureRow[];
}

const FEATURE_SECTIONS: FeatureSection[] = [
  {
    title: 'Limits',
    rows: [
      { label: 'Summary hours/mo', free: '2', pro: '10', power: '20' },
      { label: 'Translation limit/mo', free: '2', pro: '10', power: '20' },
      { label: 'Summary retention', free: '30 days', pro: '6 months', power: 'Forever' },
    ],
  },
  {
    title: 'Summarisation',
    rows: [
      { label: 'Quick summary', free: true, pro: true, power: true },
      { label: 'Contextual (deep) summary', free: true, pro: true, power: true },
      { label: 'Multi-model validation', free: false, pro: false, power: true },
    ],
  },
  {
    title: 'Community Library',
    rows: [
      {
        label: 'Browse & preview',
        free: 'Quick + 1st ¶',
        pro: 'Full preview',
        power: 'Full preview',
      },
      { label: 'Full summary reads', free: '5/mo', pro: 'Unlimited', power: 'Unlimited' },
      { label: 'Publish summaries', free: false, pro: true, power: true },
      { label: 'Creator rewards', free: false, pro: 'coming_soon', power: 'coming_soon' },
    ],
  },
  {
    title: 'Experience',
    rows: [{ label: 'Offline reading', free: true, pro: true, power: true }],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PaywallScreen() {
  const showToast = useToast();
  const { startTrial, selectPlan } = useSettingsStore();
  const { width } = useWindowDimensions();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [selectedTier, setSelectedTier] = useState<Tier>('pro');
  const [compareExpanded, setCompareExpanded] = useState(false);

  const isAnnual = billingCycle === 'annual';
  // On narrow screens (<380), cards scroll horizontally. Otherwise they sit side-by-side.
  const isNarrow = width < 380;

  const handleSelect = (tier: Tier) => {
    // TODO: Integrate with App Store subscriptions (StoreKit)
    if (tier === 'free') {
      selectPlan('free', billingCycle);
      showToast('Welcome to Bite!');
      router.back();
      return;
    }

    selectPlan(tier, billingCycle);
    startTrial();
    showToast('7-day free trial started!');
    router.back();
  };

  // --------------------------------------------------
  // Sub-components
  // --------------------------------------------------

  const renderBillingToggle = () => (
    <View style={styles.toggleRow}>
      <Pressable
        style={[styles.toggleBtn, !isAnnual && styles.toggleBtnActive]}
        onPress={() => setBillingCycle('monthly')}>
        <Text style={[styles.toggleText, !isAnnual && styles.toggleTextActive]}>
          Monthly
        </Text>
      </Pressable>
      <Pressable
        style={[styles.toggleBtn, isAnnual && styles.toggleBtnActive]}
        onPress={() => setBillingCycle('annual')}>
        <Text style={[styles.toggleText, isAnnual && styles.toggleTextActive]}>
          Annual
        </Text>
        <View style={styles.saveBadge}>
          <Text style={styles.saveBadgeText}>2 months free</Text>
        </View>
      </Pressable>
    </View>
  );

  const renderTierCard = (tier: TierInfo) => {
    const pricing = PRICING[tier.key];
    const price = isAnnual ? pricing.annual : pricing.monthly;
    const daily = isAnnual ? pricing.dailyAnnual : pricing.dailyMonthly;
    const isSelected = selectedTier === tier.key;
    const isFree = tier.key === 'free';

    return (
      <Pressable
        key={tier.key}
        style={[
          styles.tierCard,
          isSelected && styles.tierCardSelected,
          tier.badge && styles.tierCardHighlight,
        ]}
        onPress={() => setSelectedTier(tier.key)}
        accessibilityLabel={`Select ${tier.name} plan`}
        accessibilityRole="button">
        {tier.badge && (
          <View style={[styles.tierBadge, { backgroundColor: tier.badgeColor }]}>
            <Text style={styles.tierBadgeText}>{tier.badge}</Text>
          </View>
        )}

        <Text style={styles.tierName}>{tier.name}</Text>
        <Text style={styles.tierTagline}>{tier.tagline}</Text>

        <View style={styles.tierPriceRow}>
          {isFree ? (
            <Text style={styles.tierPrice}>$0</Text>
          ) : (
            <>
              <Text style={styles.tierPrice}>
                ${isAnnual ? (pricing.annual / 12).toFixed(2) : pricing.monthly.toFixed(2)}
              </Text>
              <Text style={styles.tierPriceUnit}>/mo</Text>
            </>
          )}
        </View>

        {!isFree && isAnnual && (
          <Text style={styles.tierBilled}>
            ${price.toFixed(2)}/year
          </Text>
        )}

        {!isFree && (
          <Text style={styles.tierDaily}>{daily} — less than a coffee</Text>
        )}

        {isFree && <Text style={styles.tierDaily}>Free forever</Text>}

        <View style={styles.tierLimits}>
          <LimitRow icon="time-outline" label={tier.limits.hours} />
          <LimitRow icon="language-outline" label={tier.limits.translations} />
          <LimitRow icon="cloud-outline" label={tier.limits.retention} />
        </View>

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
          </View>
        )}
      </Pressable>
    );
  };

  const renderFeatureTable = () => (
    <View style={styles.featureTable}>
      {/* Column headers */}
      <View style={styles.featureHeaderRow}>
        <View style={styles.featureLabelCell} />
        <Text style={styles.featureHeaderCell}>Free</Text>
        <Text style={styles.featureHeaderCell}>Pro</Text>
        <Text style={styles.featureHeaderCell}>Power</Text>
      </View>

      {FEATURE_SECTIONS.map((section) => (
        <View key={section.title}>
          <Text style={styles.featureSectionTitle}>{section.title}</Text>
          {section.rows.map((row) => (
            <View key={row.label} style={styles.featureRow}>
              <Text style={styles.featureLabelCell} numberOfLines={2}>
                {row.label}
              </Text>
              <FeatureCell value={row.free} />
              <FeatureCell value={row.pro} />
              <FeatureCell value={row.power} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );

  // --------------------------------------------------
  // Main render
  // --------------------------------------------------

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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.headline}>Choose your plan</Text>
        <Text style={styles.subheadline}>
          Unlock the full potential of video learning
        </Text>

        {renderBillingToggle()}

        {/* Tier cards */}
        {isNarrow ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tierCardsScroll}
            snapToInterval={width * 0.72 + 10}
            decelerationRate="fast">
            {TIERS.map(renderTierCard)}
          </ScrollView>
        ) : (
          <View style={styles.tierCards}>{TIERS.map(renderTierCard)}</View>
        )}

        {/* CTA */}
        <Pressable
          style={styles.ctaButton}
          onPress={() => handleSelect(selectedTier)}
          accessibilityLabel={
            TIERS.find((t) => t.key === selectedTier)?.cta ?? 'Continue'
          }
          accessibilityRole="button">
          <Text style={styles.ctaButtonText}>
            {TIERS.find((t) => t.key === selectedTier)?.cta}
          </Text>
        </Pressable>

        <Text style={styles.terms}>
          {selectedTier === 'free'
            ? 'No credit card required.'
            : "Cancel anytime. You won\u2019t be charged until the trial ends."}
        </Text>

        {/* Feature comparison (collapsible) */}
        <Pressable
          style={styles.compareToggle}
          onPress={() => setCompareExpanded((v) => !v)}
          accessibilityLabel="Toggle feature comparison"
          accessibilityRole="button">
          <Text style={styles.compareToggleText}>Compare all features</Text>
          <Ionicons
            name={compareExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={Colors.textSecondary}
          />
        </Pressable>

        {compareExpanded && renderFeatureTable()}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Small helper components
// ---------------------------------------------------------------------------

function LimitRow({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.limitRow}>
      <Ionicons name={icon} size={14} color={Colors.textSecondary} />
      <Text style={styles.limitText}>{label}</Text>
    </View>
  );
}

function FeatureCell({ value }: { value: CellValue }) {
  if (value === true) {
    return (
      <View style={styles.featureValueCell}>
        <Ionicons name="checkmark" size={18} color={Colors.success} />
      </View>
    );
  }
  if (value === false) {
    return (
      <View style={styles.featureValueCell}>
        <Text style={styles.featureDash}>—</Text>
      </View>
    );
  }
  if (value === 'coming_soon') {
    return (
      <View style={styles.featureValueCell}>
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>Soon</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.featureValueCell}>
      <Text style={styles.featureValueText} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 56,
  },
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 48,
  },

  // Header
  headline: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 6,
  },
  subheadline: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 24,
  },

  // Billing toggle
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  toggleBtnActive: {
    backgroundColor: Colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.text,
  },
  saveBadge: {
    backgroundColor: Colors.success + '18',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  saveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },

  // Tier cards
  tierCards: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  tierCardsScroll: {
    gap: 10,
    paddingRight: 20,
    marginBottom: 20,
  },
  tierCard: {
    flex: 1,
    minWidth: 110,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tierCardSelected: {
    borderColor: Colors.primary,
  },
  tierCardHighlight: {
    borderColor: Colors.warning,
  },
  tierBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  tierName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  tierTagline: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  tierPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tierPrice: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
  },
  tierPriceUnit: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginLeft: 2,
  },
  tierBilled: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tierDaily: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 10,
  },
  tierLimits: {
    gap: 5,
  },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  limitText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },

  // CTA
  ctaButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 8,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  terms: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },

  // Compare toggle
  compareToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    marginBottom: 8,
  },
  compareToggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  // Feature table
  featureTable: {
    marginTop: 4,
  },
  featureHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  featureHeaderCell: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  featureSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  featureLabelCell: {
    flex: 1.6,
    fontSize: 13,
    color: Colors.text,
  },
  featureValueCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureValueText: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  featureDash: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  comingSoonBadge: {
    backgroundColor: Colors.warning + '20',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.warning,
  },
});
