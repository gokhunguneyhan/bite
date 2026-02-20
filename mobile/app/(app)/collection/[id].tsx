import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/src/constants/colors';
import { useCollection } from '@/src/hooks/useCollections';
import type { CollectionItem } from '@/src/services/collectionService';

function ItemCard({ item }: { item: CollectionItem }) {
  const hasSummary = !!item.summary;

  const handlePress = () => {
    if (hasSummary) {
      router.push(`/summary/${item.summaryId}`);
    } else {
      const videoId = item.videoId ?? '';
      router.push({
        pathname: '/confirm-analyse',
        params: {
          videoId,
          title: item.videoTitle,
          channelName: item.channelName,
          thumbnailUrl: item.thumbnailUrl,
          durationLabel: '',
        },
      });
    }
  };

  return (
    <Pressable style={styles.itemCard} onPress={handlePress}>
      <Image
        source={{ uri: item.thumbnailUrl }}
        style={styles.itemThumb}
        contentFit="cover"
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={2}>
          {hasSummary ? item.summary!.videoTitle : item.videoTitle}
        </Text>
        <Text style={styles.itemChannel} numberOfLines={1}>
          {hasSummary ? item.summary!.channelName : item.channelName}
        </Text>
        {!hasSummary && (
          <View style={styles.summariseTag}>
            <Ionicons name="sparkles" size={10} color="#fff" />
            <Text style={styles.summariseTagText}>Summarise</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useCollection(id);

  const collection = data?.collection;
  const items = data?.items ?? [];

  return (
    <>
      <Stack.Screen options={{ title: collection?.title ?? 'Collection' }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}>
        {isLoading && (
          <ActivityIndicator color={Colors.primary} size="large" style={styles.loader} />
        )}

        {collection && !isLoading && (
          <>
            {collection.description ? (
              <Text style={styles.description}>{collection.description}</Text>
            ) : null}
            <Text style={styles.itemCountLabel}>
              {items.length} video{items.length !== 1 ? 's' : ''}
            </Text>
          </>
        )}

        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}

        {!isLoading && items.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>This collection is empty.</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 24,
    paddingTop: 16,
  },
  loader: {
    marginTop: 40,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  itemCountLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  itemThumb: {
    width: 120,
    height: 80,
    backgroundColor: Colors.border,
  },
  itemInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    gap: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
  },
  itemChannel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  summariseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 2,
  },
  summariseTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
});
