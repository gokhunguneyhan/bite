import { View, Text, Switch, StyleSheet } from 'react-native';
import { Colors } from '@/src/constants/colors';

interface OwnerProps {
  isOwner: true;
  isPublic: boolean;
  isAnonymous: boolean;
  isPending: boolean;
  onTogglePublic: () => void;
  onToggleAnonymous: () => void;
}

interface ViewerProps {
  isOwner: false;
  analystName?: string;
  analysisCount?: number;
}

type Props = OwnerProps | ViewerProps;

export function CommunityShareCallout(props: Props) {
  if (props.isOwner) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Community Sharing</Text>
        <Text style={styles.description}>
          {props.isPublic
            ? "This analysis is shared with the community but we've hidden your name."
            : 'Turn on sharing to let others discover this analysis.'}
        </Text>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Share to community</Text>
          <Switch
            value={props.isPublic}
            onValueChange={props.onTogglePublic}
            disabled={props.isPending}
            trackColor={{ true: Colors.primary, false: Colors.border }}
            accessibilityLabel="Share to community"
          />
        </View>

        {props.isPublic && (
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Show my name</Text>
            <Switch
              value={!props.isAnonymous}
              onValueChange={props.onToggleAnonymous}
              trackColor={{ true: Colors.primary, false: Colors.border }}
              accessibilityLabel="Show my name"
            />
          </View>
        )}
      </View>
    );
  }

  // Viewer mode
  const name = props.analystName || 'Anonymous';
  const count = props.analysisCount ?? 0;

  return (
    <View style={styles.viewerContainer}>
      <View style={styles.viewerAvatar}>
        <Text style={styles.viewerInitial}>{name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.viewerInfo}>
        <Text style={styles.viewerName}>
          Analysed by {name}
        </Text>
        {count > 0 && (
          <Text style={styles.viewerCount}>
            {count} {count === 1 ? 'analysis' : 'analyses'}
          </Text>
        )}
      </View>
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
  heading: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 15,
    color: Colors.text,
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
  viewerCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
