import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import type { Collection } from '@/src/services/collectionService';

interface CollectionCardProps {
  collection: Collection;
  width?: number;
}

export function CollectionCard({ collection, width }: CollectionCardProps) {
  const coverUri = collection.coverImageUrl ?? collection.firstThumbnail;

  return (
    <Pressable
      style={[styles.container, width ? { width } : undefined]}
      onPress={() => router.push(`/collection/${collection.id}`)}>
      {coverUri ? (
        <Image source={{ uri: coverUri }} style={styles.cover} contentFit="cover" />
      ) : (
        <View style={[styles.cover, styles.placeholderCover]}>
          <Ionicons name="library-outline" size={28} color={Colors.textSecondary} />
        </View>
      )}
      <View style={styles.overlay}>
        <Text style={styles.title} numberOfLines={2}>
          {collection.title}
        </Text>
        <Text style={styles.count}>
          {collection.itemCount} video{collection.itemCount !== 1 ? 's' : ''}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  cover: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.border,
  },
  placeholderCover: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    padding: 10,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
  },
  count: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
