import { View, Text, Pressable, Share, Linking, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { useToast } from '@/src/components/ui/Toast';
import { useBookmarkStore } from '@/src/stores/bookmarkStore';

interface Props {
  summaryId: string;
  sectionIndex: number;
  sectionTitle: string;
  sectionContent: string;
  videoTitle: string;
  channelName: string;
  videoId: string;
  timestampStart: number;
  onPlay?: (videoId: string, startSeconds: number, sectionTitle: string) => void;
}

export function SectionActions({
  summaryId,
  sectionIndex,
  sectionTitle,
  sectionContent,
  videoTitle,
  channelName,
  videoId,
  timestampStart,
  onPlay,
}: Props) {
  const showToast = useToast();
  const isBookmarked = useBookmarkStore((s) =>
    s.isBookmarked(summaryId, sectionIndex),
  );
  const addBookmark = useBookmarkStore((s) => s.addBookmark);
  const removeBookmark = useBookmarkStore((s) => s.removeBookmark);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(`${sectionTitle}\n\n${sectionContent}`);
    showToast('Copied to clipboard');
  };

  const handleShare = async () => {
    await Share.share({
      message: `${sectionTitle}\n\n${sectionContent}\n\n— from "${videoTitle}" by ${channelName}`,
    });
  };

  const handleBookmark = () => {
    if (isBookmarked) {
      removeBookmark(summaryId, sectionIndex);
      showToast('Removed from saved');
    } else {
      addBookmark({
        summaryId,
        sectionIndex,
        sectionTitle,
        sectionContent: sectionContent.slice(0, 200),
        videoTitle,
        channelName,
      });
      showToast('Saved');
    }
  };

  const handlePlay = () => {
    if (onPlay) {
      onPlay(videoId, timestampStart, sectionTitle);
    } else {
      const t = Math.floor(timestampStart);
      Linking.openURL(`https://youtube.com/watch?v=${videoId}&t=${t}`);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.button}
        onPress={handleCopy}
        accessibilityLabel="Copy section"
        accessibilityRole="button">
        <Ionicons name="copy-outline" size={16} color={Colors.textSecondary} />
        <Text style={styles.buttonText}>Copy</Text>
      </Pressable>
      <Pressable
        style={styles.button}
        onPress={handleShare}
        accessibilityLabel="Share section"
        accessibilityRole="button">
        <Ionicons
          name="share-outline"
          size={16}
          color={Colors.textSecondary}
        />
        <Text style={styles.buttonText}>Share</Text>
      </Pressable>
      <Pressable
        style={styles.button}
        onPress={handleBookmark}
        accessibilityLabel={isBookmarked ? 'Remove from saved' : 'Save section'}
        accessibilityRole="button">
        <Ionicons
          name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
          size={16}
          color={isBookmarked ? Colors.primary : Colors.textSecondary}
        />
        <Text
          style={[
            styles.buttonText,
            isBookmarked && { color: Colors.primary },
          ]}>
          {isBookmarked ? 'Saved' : 'Save'}
        </Text>
      </Pressable>
      <Pressable
        style={styles.button}
        onPress={handlePlay}
        accessibilityLabel="Play from this timestamp"
        accessibilityRole="button">
        <Ionicons name="play-circle-outline" size={16} color={Colors.textSecondary} />
        <Text style={styles.buttonText}>Watch</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  buttonText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
