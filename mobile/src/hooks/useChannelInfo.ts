import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/src/services/api';
import { fetchChannelLatestVideos } from '@/src/services/youtubeApiService';
import type { YouTubeVideo } from '@/src/mocks/youtubeSubscriptions';

interface ChannelInfo {
  channelId: string | null;
  avatarUrl: string | null;
  channelName: string;
}

export function useChannelInfo(channelName: string | undefined) {
  return useQuery({
    queryKey: ['channel-info', channelName],
    queryFn: () =>
      apiRequest<ChannelInfo>(
        `/api/channel-info?name=${encodeURIComponent(channelName!)}`,
      ),
    enabled: !!channelName,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useChannelVideos(channelId: string | null | undefined) {
  return useQuery<YouTubeVideo[]>({
    queryKey: ['channel-videos', channelId],
    queryFn: () => fetchChannelLatestVideos(channelId!, 10),
    enabled: !!channelId,
    staleTime: 5 * 60 * 1000,
  });
}
