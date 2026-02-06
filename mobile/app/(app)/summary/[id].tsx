import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { useSummary } from '@/src/hooks/useSummary';

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function SummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: summary, isLoading, error } = useSummary(id);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (error || !summary) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Summary not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.linkText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{ uri: summary.thumbnailUrl }}
        style={styles.thumbnail}
        resizeMode="cover"
      />

      <View style={styles.videoMeta}>
        <Text style={styles.videoTitle}>{summary.videoTitle}</Text>
        <Pressable
          onPress={() => router.push(`/creator/${summary.videoId}`)}>
          <Text style={styles.channelName}>{summary.channelName}</Text>
        </Pressable>
      </View>

      {/* Quick Summary */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="flash-outline" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Quick Summary</Text>
          <Text style={styles.badge}>30s read</Text>
        </View>
        <Text style={styles.quickSummaryText}>{summary.quickSummary}</Text>
      </View>

      {/* Contextual Summary */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="book-outline" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Contextual Summary</Text>
        </View>
        {summary.contextualSections.map((section, index) => (
          <View key={index} style={styles.contextBlock}>
            <View style={styles.contextHeader}>
              <Text style={styles.contextTitle}>{section.title}</Text>
              <Text style={styles.timestamp}>
                {formatTimestamp(section.timestampStart)} -{' '}
                {formatTimestamp(section.timestampEnd)}
              </Text>
            </View>
            <Text style={styles.contextContent}>{section.content}</Text>
          </View>
        ))}
      </View>

      {/* Refresher Cards CTA */}
      <Pressable
        style={styles.refresherButton}
        onPress={() => router.push(`/refresher/${id}`)}>
        <Ionicons name="albums-outline" size={20} color="#fff" />
        <Text style={styles.refresherButtonText}>
          Start Refresher Cards ({summary.refresherCards.length})
        </Text>
      </Pressable>

      {/* Actionable Insights */}
      {summary.actionableInsights.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color={Colors.success}
            />
            <Text style={styles.sectionTitle}>Actionable Insights</Text>
          </View>
          {summary.actionableInsights.map((insight, index) => (
            <View key={index} style={styles.insightRow}>
              <Text style={styles.insightNumber}>{index + 1}</Text>
              <Text style={styles.insightText}>{insight}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Books & Resources */}
      {summary.affiliateLinks.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="bookmark-outline"
              size={18}
              color={Colors.warning}
            />
            <Text style={styles.sectionTitle}>Books & Resources</Text>
          </View>
          {summary.affiliateLinks.map((link, index) => (
            <Pressable key={index} style={styles.affiliateCard}>
              <Ionicons
                name={link.type === 'book' ? 'book' : 'link'}
                size={20}
                color={Colors.textSecondary}
              />
              <Text style={styles.affiliateTitle}>{link.title}</Text>
              <Ionicons
                name="open-outline"
                size={16}
                color={Colors.tabIconDefault}
              />
            </Pressable>
          ))}
        </View>
      )}

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  linkText: {
    fontSize: 16,
    color: Colors.primary,
  },
  thumbnail: {
    width: '100%',
    height: 220,
    backgroundColor: Colors.border,
  },
  videoMeta: {
    padding: 20,
    paddingBottom: 8,
  },
  videoTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 28,
  },
  channelName: {
    fontSize: 15,
    color: Colors.primary,
    marginTop: 6,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  badge: {
    fontSize: 12,
    color: Colors.primary,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontWeight: '600',
    overflow: 'hidden',
  },
  quickSummaryText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 26,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  contextBlock: {
    marginBottom: 20,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  contextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  contextTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.tabIconDefault,
    fontFamily: 'SpaceMono',
  },
  contextContent: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  refresherButton: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  refresherButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  insightRow: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 12,
    alignItems: 'flex-start',
  },
  insightNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.success + '20',
    color: Colors.success,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 13,
    fontWeight: '700',
    overflow: 'hidden',
  },
  insightText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  affiliateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  affiliateTitle: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
});
