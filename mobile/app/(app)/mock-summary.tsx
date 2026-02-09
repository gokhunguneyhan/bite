import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { MOCK_SUMMARY } from '@/src/mocks/mockSummary';

export default function MockSummaryScreen() {
  const s = MOCK_SUMMARY;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Thumbnail */}
        <Image
          source={{ uri: s.thumbnailUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
        />

        <View style={styles.body}>
          {/* Title + Meta */}
          <Text style={styles.title}>{s.videoTitle}</Text>
          <Text style={styles.channel}>{s.channelName}</Text>

          <View style={styles.badges}>
            <Text style={styles.langBadge}>
              {s.originalLanguage.toUpperCase()}
            </Text>
            <Text style={styles.categoryBadge}>{s.category}</Text>
          </View>

          {/* Quick Summary */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flash-outline" size={18} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Quick Summary</Text>
            </View>
            <Text style={styles.sectionContent}>{s.quickSummary}</Text>
          </View>

          {/* Contextual Sections */}
          {s.contextualSections.map((section, i) => (
            <View key={i} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color={Colors.primary}
                />
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <Text style={styles.sectionContent}>{section.content}</Text>
            </View>
          ))}

          {/* Refresher Cards Preview */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="albums-outline" size={18} color={Colors.primary} />
              <Text style={styles.sectionTitle}>
                Refresher Cards ({s.refresherCards.length})
              </Text>
            </View>
            {s.refresherCards.map((card) => (
              <View key={card.id} style={styles.cardPreview}>
                <Text style={styles.cardQuestion}>{card.title}</Text>
                <Text style={styles.cardAnswer}>{card.explanation}</Text>
              </View>
            ))}
          </View>

          {/* Insights */}
          {s.actionableInsights.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bulb-outline" size={18} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Actionable Insights</Text>
              </View>
              {s.actionableInsights.map((insight, i) => (
                <View key={i} style={styles.insightRow}>
                  <Text style={styles.insightCategory}>{insight.category}</Text>
                  <Text style={styles.insightText}>{insight.insight}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky CTA Bar */}
      <View style={styles.ctaBar}>
        <Pressable
          style={styles.ctaButton}
          onPress={() => router.push('/paywall')}
          accessibilityLabel="Start free trial"
          accessibilityRole="button">
          <Ionicons name="diamond-outline" size={20} color="#fff" />
          <Text style={styles.ctaText}>
            Start 7-day free trial to explore more
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
  },
  scrollContent: {
    paddingBottom: 100,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.border,
  },
  body: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 26,
  },
  channel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  langBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    backgroundColor: Colors.border,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionContent: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  cardPreview: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 14,
    gap: 6,
  },
  cardQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  cardAnswer: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  insightRow: {
    gap: 4,
  },
  insightCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 34,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
