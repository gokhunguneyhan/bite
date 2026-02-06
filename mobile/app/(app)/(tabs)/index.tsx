import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState, useMemo } from 'react';
import { router } from 'expo-router';
import { Colors } from '@/src/constants/colors';
import { extractVideoId } from '@/src/services/youtube';
import { useSummaries, useGenerateSummary } from '@/src/hooks/useSummary';
import { useVideoPreview } from '@/src/hooks/useVideoPreview';
import { SummaryCard } from '@/src/components/summary/SummaryCard';
import { SummarizeProgress } from '@/src/components/summary/SummarizeProgress';

export default function HomeScreen() {
  const [url, setUrl] = useState('');
  const { data: summaries, isLoading } = useSummaries();
  const generateMutation = useGenerateSummary();
  const videoId = useMemo(() => extractVideoId(url.trim()), [url]);
  const { data: preview } = useVideoPreview(videoId);

  const handleSummarize = () => {
    const videoId = extractVideoId(url.trim());
    if (!videoId) {
      Alert.alert(
        'Invalid URL',
        'Please paste a valid YouTube video URL.',
      );
      return;
    }

    generateMutation.mutate(videoId, {
      onSuccess: (summary) => {
        setUrl('');
        router.push(`/summary/${summary.id}`);
      },
      onError: (error: Error) => {
        Alert.alert('Error', error.message);
      },
    });
  };

  const isGenerating = generateMutation.isPending;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={summaries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SummaryCard summary={item} />}
        contentContainerStyle={styles.listContent}
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.greeting}>What will you learn today?</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Paste a YouTube URL..."
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                placeholderTextColor={Colors.tabIconDefault}
                returnKeyType="go"
                onSubmitEditing={handleSummarize}
                editable={!isGenerating}
              />
              {preview && !isGenerating && (
                <View style={styles.preview}>
                  <Image
                    source={{ uri: preview.thumbnailUrl }}
                    style={styles.previewThumb}
                    resizeMode="cover"
                  />
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewTitle} numberOfLines={2}>
                      {preview.title}
                    </Text>
                    <Text style={styles.previewChannel}>
                      {preview.channelName}
                    </Text>
                  </View>
                </View>
              )}
              {isGenerating ? (
                <SummarizeProgress />
              ) : (
                <Pressable
                  style={[
                    styles.button,
                    !url.trim() && styles.buttonDisabled,
                  ]}
                  onPress={handleSummarize}
                  disabled={!url.trim()}>
                  <Text style={styles.buttonText}>Summarize</Text>
                </Pressable>
              )}
            </View>

            {summaries && summaries.length > 0 && (
              <Text style={styles.sectionTitle}>Recent Summaries</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator
              color={Colors.primary}
              style={styles.loader}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No summaries yet. Paste a YouTube URL above to get started.
              </Text>
            </View>
          )
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 24,
  },
  inputContainer: {
    gap: 12,
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  preview: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewThumb: {
    width: 100,
    height: 70,
    backgroundColor: Colors.border,
  },
  previewInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
  },
  previewChannel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  loader: {
    marginTop: 40,
  },
});
