import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/src/constants/colors';
import { useEditorsPicks } from '@/src/hooks/useEditorsPicks';
import { VerticalVideoCard } from '@/src/components/summary/VerticalVideoCard';

export default function EditorsPicksScreen() {
  const insets = useSafeAreaInsets();
  const { data: picks, isLoading } = useEditorsPicks();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}>
      {isLoading && (
        <ActivityIndicator color={Colors.primary} size="large" style={styles.loader} />
      )}
      {!isLoading && (!picks || picks.length === 0) && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No editor's picks yet.</Text>
        </View>
      )}
      {(picks ?? []).map((summary) => (
        <VerticalVideoCard key={summary.id} summary={summary} isEditorsPick />
      ))}
    </ScrollView>
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
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
});
