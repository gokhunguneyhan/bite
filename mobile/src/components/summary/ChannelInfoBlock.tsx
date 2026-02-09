import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/src/constants/colors';

interface Props {
  channelName: string;
  isFollowing: boolean;
  isMutating: boolean;
  onToggleFollow: () => void;
}

export function ChannelInfoBlock({
  channelName,
  isFollowing,
  isMutating,
  onToggleFollow,
}: Props) {
  const initial = channelName.charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.left}
        onPress={() =>
          router.push({ pathname: '/creator/[id]', params: { id: channelName } })
        }
        accessibilityLabel={`View ${channelName} profile`}
        accessibilityRole="button">
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View>
          <Text style={styles.name}>{channelName}</Text>
          {/* TODO: Fetch real subscriber/video count from YouTube Data API */}
          <Text style={styles.stats}>N/A subscribers</Text>
        </View>
      </Pressable>
      <Pressable
        style={[styles.followBtn, isFollowing && styles.followBtnActive]}
        onPress={onToggleFollow}
        disabled={isMutating}
        accessibilityLabel={isFollowing ? `Unfollow ${channelName}` : `Follow ${channelName}`}
        accessibilityRole="button">
        <Text
          style={[
            styles.followBtnText,
            isFollowing && styles.followBtnTextActive,
          ]}>
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
  },
  left: {
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
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  stats: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  followBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  followBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  followBtnTextActive: {
    color: '#fff',
  },
});
