import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/src/services/api';

interface VideoPreview {
  title: string;
  channelName: string;
  thumbnailUrl: string;
}

export function useVideoPreview(videoId: string | null) {
  return useQuery({
    queryKey: ['videoPreview', videoId],
    queryFn: () => apiRequest<VideoPreview>(`/api/video/${videoId}`),
    enabled: !!videoId,
    retry: false,
    staleTime: Infinity,
  });
}
