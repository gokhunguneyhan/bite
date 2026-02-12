import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { extractVideoId } from '@/src/services/youtube';
import { useGenerateSummary, useSummaries } from '@/src/hooks/useSummary';
import { useVideoPreview } from '@/src/hooks/useVideoPreview';
import { useShareIntentUrl } from '@/src/hooks/useShareIntent';
import { FullScreenLoader } from '@/src/components/summary/FullScreenLoader';
import { useToast } from '@/src/components/ui/Toast';
import { useRevenueCat } from '@/src/providers/RevenueCatProvider';

export default function AnalyseScreen() {
  const params = useLocalSearchParams<{ url?: string }>();
  const [url, setUrl] = useState(params.url ?? '');
  const showToast = useToast();

  // Pre-fill URL from route params (e.g. from creator page)
  useEffect(() => {
    if (params.url && params.url !== url) {
      setUrl(params.url);
    }
  }, [params.url]);
  const generateMutation = useGenerateSummary();
  const { data: summaries } = useSummaries();
  const videoId = useMemo(() => extractVideoId(url.trim()), [url]);
  const { data: preview } = useVideoPreview(videoId);

  const handleSharedUrl = useCallback((sharedUrl: string) => {
    setUrl(sharedUrl);
  }, []);
  useShareIntentUrl(handleSharedUrl);

  const { isPro } = useRevenueCat();

  const handleAnalyse = () => {
    const id = extractVideoId(url.trim());
    if (!id) {
      Alert.alert('Invalid URL', 'Please paste a valid YouTube video URL.');
      return;
    }

    if (!isPro) {
      router.push('/paywall');
      return;
    }

    generateMutation.mutate(id, {
      onSuccess: (summary) => {
        setUrl('');
        router.replace(`/summary/${summary.id}`);
      },
      onError: (error: Error) => {
        Alert.alert('Error', error.message);
      },
    });
  };

  const isGenerating = generateMutation.isPending;

  if (isGenerating) {
    return (
      <FullScreenLoader
        thumbnailUrl={preview?.thumbnailUrl}
        videoTitle={preview?.title}
        channelName={preview?.channelName}
        showToast={showToast}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <View style={styles.iconContainer}>
          <Ionicons name="sparkles" size={32} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Paste a YouTube URL to get started</Text>
        <Text style={styles.subtitle}>
          We'll fetch the transcript and generate a contextual summary for you.
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="https://youtube.com/watch?v=..."
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholderTextColor={Colors.tabIconDefault}
            returnKeyType="go"
            onSubmitEditing={handleAnalyse}
            accessibilityLabel="YouTube URL input"
          />

          {preview && (
            <View style={styles.preview}>
              <Image
                source={{ uri: preview.thumbnailUrl }}
                style={styles.previewThumb}
                contentFit="cover"
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

          <Pressable
            style={[styles.button, !url.trim() && styles.buttonDisabled]}
            onPress={handleAnalyse}
            disabled={!url.trim()}
            accessibilityLabel="Analyse video"
            accessibilityRole="button">
            <Ionicons name="sparkles-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Analyse</Text>
          </Pressable>

          <Pressable
            style={styles.importButton}
            onPress={() => showToast('Coming soon \u2014 will import your Watch Later videos')}
            accessibilityLabel="Import from Google"
            accessibilityRole="button">
            <Ionicons name="cloud-download-outline" size={18} color={Colors.text} />
            <Text style={styles.importButtonText}>Import from Google</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityRole="button">
          <Text style={styles.skipText}>Go back to feed</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  inputContainer: {
    width: '100%',
    gap: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  importButton: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  importButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  preview: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewThumb: {
    width: 120,
    height: 80,
    backgroundColor: Colors.border,
  },
  previewInfo: {
    flex: 1,
    padding: 12,
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
    marginTop: 4,
  },
  skipText: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 8,
  },
});
