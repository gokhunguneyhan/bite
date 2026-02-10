import { View, Text, Switch, Pressable, StyleSheet } from 'react-native';
import { Colors } from '@/src/constants/colors';

interface OwnerProps {
  isOwner: true;
  isAnonymous: boolean;
  isPending: boolean;
  onToggleAnonymous: () => void;
}

interface ViewerProps {
  isOwner: false;
  analystName?: string;
  analysisCount?: number;
  onFollow?: () => void;
  isFollowing?: boolean;
}

type Props = OwnerProps | ViewerProps;

export function CommunityShareCallout(props: Props) {
  if (props.isOwner) {
    return (
      <View style={styles.container}>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>Stay anonymous</Text>
            <Text style={styles.description}>
              {props.isAnonymous
                ? 'Your name is hidden on this analysis'
                : 'Your name is visible on this analysis'}
            </Text>
          </View>
          <Switch
            value={props.isAnonymous}
            onValueChange={props.onToggleAnonymous}
            disabled={props.isPending}
            trackColor={{ true: Colors.primary, false: Colors.border }}
            accessibilityLabel="Stay anonymous"
          />
        </View>
      </View>
    );
  }

  // Viewer mode — if anonymous (no analystName), render nothing
  if (!props.analystName) return null;

  const name = props.analystName;

  return (
    <View style={styles.viewerContainer}>
      <View style={styles.viewerAvatar}>
        <Text style={styles.viewerInitial}>{name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.viewerInfo}>
        <Text style={styles.viewerName}>{name}</Text>
      </View>
      {props.onFollow && (
        <Pressable
          style={[
            styles.followButton,
            props.isFollowing && styles.followButtonActive,
          ]}
          onPress={props.onFollow}>
          <Text
            style={[
              styles.followButtonText,
              props.isFollowing && styles.followButtonTextActive,
            ]}>
            {props.isFollowing ? 'Following' : 'Follow'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  viewerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  viewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerInitial: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  viewerInfo: {
    flex: 1,
  },
  viewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.primary,
  },
  followButtonActive: {
    backgroundColor: Colors.primary + '15',
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  followButtonTextActive: {
    color: Colors.primary,
  },
});
