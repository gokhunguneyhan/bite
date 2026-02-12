import { useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import YoutubePlayer, { type YoutubeIframeRef } from 'react-native-youtube-iframe';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;
export const PLAYER_HEIGHT = (SCREEN_WIDTH * 9) / 16;

interface MiniYouTubePlayerProps {
  videoId: string;
  startSeconds: number;
  sectionTitle: string;
  onClose: () => void;
}

export default function MiniYouTubePlayer({
  videoId,
  startSeconds,
  sectionTitle,
  onClose,
}: MiniYouTubePlayerProps) {
  const playerRef = useRef<YoutubeIframeRef>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      setIsPlaying(false);
    }
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  if (isMinimized) {
    return (
      <View style={styles.minimizedBar}>
        <Pressable onPress={() => setIsMinimized(false)} style={styles.minimizedContent}>
          <Ionicons name="play-circle" size={24} color={Colors.primary} />
          <Text style={styles.minimizedTitle} numberOfLines={1}>
            {sectionTitle}
          </Text>
        </Pressable>
        <View style={styles.minimizedActions}>
          <Pressable onPress={togglePlay} hitSlop={8}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={20}
              color={Colors.text}
            />
          </Pressable>
          <Pressable onPress={onClose} hitSlop={8} style={{ marginLeft: 12 }}>
            <Ionicons name="close" size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {sectionTitle}
        </Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => setIsMinimized(true)} hitSlop={8}>
            <Ionicons name="chevron-down" size={22} color="#aaa" />
          </Pressable>
          <Pressable onPress={onClose} hitSlop={8} style={{ marginLeft: 12 }}>
            <Ionicons name="close" size={22} color="#999" />
          </Pressable>
        </View>
      </View>

      <YoutubePlayer
        ref={playerRef}
        height={PLAYER_HEIGHT}
        width={SCREEN_WIDTH}
        play={isPlaying}
        videoId={videoId}
        initialPlayerParams={{
          start: Math.floor(startSeconds),
          modestbranding: true,
          rel: false,
          showClosedCaptions: false,
        }}
        onChangeState={onStateChange}
        webViewProps={{
          allowsInlineMediaPlayback: true,
          mediaPlaybackRequiresUserAction: false,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1a1a1a',
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  minimizedBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 52,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  minimizedContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  minimizedTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
  },
  minimizedActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
