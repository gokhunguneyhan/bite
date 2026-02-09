/**
 * Mock YouTube subscription data.
 * TODO: Replace with real Google Sign-In + YouTube Data API v3
 * Endpoint: GET https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true
 */

export interface YouTubeSubscription {
  channelId: string;
  channelName: string;
  thumbnailUrl: string;
  subscriberCount: string;
}

export interface YouTubeVideo {
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  publishedAt: string;
  durationLabel: string;
}

export const MOCK_YOUTUBE_SUBSCRIPTIONS: YouTubeSubscription[] = [
  {
    channelId: 'UCsBjURrPoezykLs9EqgamOA',
    channelName: 'Fireship',
    thumbnailUrl: 'https://img.youtube.com/vi/rZ41y93P2Qo/mqdefault.jpg',
    subscriberCount: '2.8M',
  },
  {
    channelId: 'UCoOae5nYA7VqaXzerajD0lg',
    channelName: 'Ali Abdaal',
    thumbnailUrl: 'https://img.youtube.com/vi/Z-zNHHpXoMM/mqdefault.jpg',
    subscriberCount: '5.2M',
  },
  {
    channelId: 'UC2D2CMWXMOVWx7giW1n3LIg',
    channelName: 'Andrew Huberman',
    thumbnailUrl: 'https://img.youtube.com/vi/QmOF0crdyRU/mqdefault.jpg',
    subscriberCount: '6.1M',
  },
  {
    channelId: 'UCHnyfMqiRRG1u-2MsSQLbXA',
    channelName: 'Veritasium',
    thumbnailUrl: 'https://img.youtube.com/vi/HeQX2HjkcNo/mqdefault.jpg',
    subscriberCount: '15.9M',
  },
  {
    channelId: 'UCYO_jab_esuFRV4b17AJtAw',
    channelName: '3Blue1Brown',
    thumbnailUrl: 'https://img.youtube.com/vi/zjMuIxRvygQ/mqdefault.jpg',
    subscriberCount: '6.3M',
  },
  {
    channelId: 'UCbRP3c757lWg9M-U7TyEkXA',
    channelName: 'Theo',
    thumbnailUrl: 'https://img.youtube.com/vi/CDbkDsnmjmY/mqdefault.jpg',
    subscriberCount: '380K',
  },
];

/**
 * Mock "latest videos" per channel — shown on creator detail page.
 * TODO: Replace with YouTube Data API v3
 * Endpoint: GET https://www.googleapis.com/youtube/v3/search?part=snippet&channelId={id}&order=date&type=video
 */
export const MOCK_CHANNEL_VIDEOS: Record<string, YouTubeVideo[]> = {
  Fireship: [
    {
      videoId: 'rZ41y93P2Qo',
      title: 'God-Tier Developer Roadmap 2026',
      channelName: 'Fireship',
      thumbnailUrl: 'https://img.youtube.com/vi/rZ41y93P2Qo/maxresdefault.jpg',
      publishedAt: '2026-02-05T12:00:00Z',
      durationLabel: '12:34',
    },
    {
      videoId: '4WxK0BVyNGc',
      title: 'AI Agents Are Taking Over... Here\'s Why',
      channelName: 'Fireship',
      thumbnailUrl: 'https://img.youtube.com/vi/4WxK0BVyNGc/maxresdefault.jpg',
      publishedAt: '2026-02-02T12:00:00Z',
      durationLabel: '8:21',
    },
    {
      videoId: '6u7fA5m8bHE',
      title: '10 Languages That Will Dominate in 2026',
      channelName: 'Fireship',
      thumbnailUrl: 'https://img.youtube.com/vi/6u7fA5m8bHE/maxresdefault.jpg',
      publishedAt: '2026-01-28T12:00:00Z',
      durationLabel: '10:05',
    },
  ],
  'Ali Abdaal': [
    {
      videoId: 'Z-zNHHpXoMM',
      title: 'How I Manage My Time — Realistic Day in the Life',
      channelName: 'Ali Abdaal',
      thumbnailUrl: 'https://img.youtube.com/vi/Z-zNHHpXoMM/maxresdefault.jpg',
      publishedAt: '2026-02-04T12:00:00Z',
      durationLabel: '18:42',
    },
    {
      videoId: 'lHQLSl4-g-U',
      title: 'The Productivity System That Changed Everything',
      channelName: 'Ali Abdaal',
      thumbnailUrl: 'https://img.youtube.com/vi/lHQLSl4-g-U/maxresdefault.jpg',
      publishedAt: '2026-01-30T12:00:00Z',
      durationLabel: '22:15',
    },
  ],
  'Andrew Huberman': [
    {
      videoId: 'QmOF0crdyRU',
      title: 'The Science of Sleep & How to Improve It',
      channelName: 'Andrew Huberman',
      thumbnailUrl: 'https://img.youtube.com/vi/QmOF0crdyRU/maxresdefault.jpg',
      publishedAt: '2026-02-03T12:00:00Z',
      durationLabel: '1:42:10',
    },
  ],
  Veritasium: [
    {
      videoId: 'HeQX2HjkcNo',
      title: 'The Most Satisfying Math Problem Ever',
      channelName: 'Veritasium',
      thumbnailUrl: 'https://img.youtube.com/vi/HeQX2HjkcNo/maxresdefault.jpg',
      publishedAt: '2026-02-01T12:00:00Z',
      durationLabel: '21:08',
    },
  ],
  '3Blue1Brown': [
    {
      videoId: 'zjMuIxRvygQ',
      title: 'But What Is a Neural Network, Really?',
      channelName: '3Blue1Brown',
      thumbnailUrl: 'https://img.youtube.com/vi/zjMuIxRvygQ/maxresdefault.jpg',
      publishedAt: '2026-01-29T12:00:00Z',
      durationLabel: '25:17',
    },
  ],
  Theo: [
    {
      videoId: 'CDbkDsnmjmY',
      title: 'Why Everyone Is Wrong About Server Components',
      channelName: 'Theo',
      thumbnailUrl: 'https://img.youtube.com/vi/CDbkDsnmjmY/maxresdefault.jpg',
      publishedAt: '2026-02-06T12:00:00Z',
      durationLabel: '15:33',
    },
  ],
};
