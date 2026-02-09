import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/src/constants/colors';
import { useSubscriptions, useUnsubscribe } from '@/src/hooks/useSummary';
import { useUserFollowStore, type UserFollow } from '@/src/stores/userFollowStore';

type FollowItem =
  | { type: 'channel'; id: string; name: string }
  | { type: 'user'; data: UserFollow };

export default function FollowingScreen() {
  const { data: subscriptions } = useSubscriptions();
  const unsubscribe = useUnsubscribe();
  const follows = useUserFollowStore((s) => s.follows);
  const unfollowUser = useUserFollowStore((s) => s.unfollowUser);

  const items: FollowItem[] = [
    ...(subscriptions ?? []).map(
      (s) => ({ type: 'channel' as const, id: s.id, name: s.channelName }),
    ),
    ...follows.map((f) => ({ type: 'user' as const, data: f })),
  ];

  const renderItem = ({ item }: { item: FollowItem }) => {
    if (item.type === 'channel') {
      return (
        <View style={styles.row}>
          <Pressable
            style={styles.rowLeft}
            onPress={() =>
              router.push({ pathname: '/creator/[id]', params: { id: item.name } })
            }
            accessibilityLabel={`View ${item.name} profile`}
            accessibilityRole="button">
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.subtitle}>Channel</Text>
            </View>
          </Pressable>
          <Pressable
            style={styles.unfollowBtn}
            onPress={() => unsubscribe.mutate(item.name)}
            disabled={unsubscribe.isPending}
            accessibilityLabel={`Unfollow ${item.name}`}
            accessibilityRole="button">
            <Text style={styles.unfollowText}>Unfollow</Text>
          </Pressable>
        </View>
      );
    }

    const { data } = item;
    return (
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <View style={[styles.avatar, styles.userAvatar]}>
            <Text style={[styles.avatarText, styles.userAvatarText]}>
              {data.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.name}>{data.displayName}</Text>
            <Text style={styles.subtitle}>
              {data.analysisCount} {data.analysisCount === 1 ? 'analysis' : 'analyses'}
            </Text>
          </View>
        </View>
        <Pressable
          style={styles.unfollowBtn}
          onPress={() => unfollowUser(data.userId)}
          accessibilityLabel={`Unfollow ${data.displayName}`}
          accessibilityRole="button">
          <Text style={styles.unfollowText}>Unfollow</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <FlatList
      data={items}
      keyExtractor={(item) =>
        item.type === 'channel' ? `ch_${item.id}` : `usr_${item.data.userId}`
      }
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={48} color={Colors.border} />
          <Text style={styles.emptyText}>
            You're not following anyone yet.
          </Text>
          <Text style={styles.emptySubtext}>
            Follow channels and analysts to see them here.
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  userAvatar: {
    backgroundColor: Colors.success + '15',
  },
  userAvatarText: {
    color: Colors.success,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  unfollowBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unfollowText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
