export type Platform = 'mastodon';
export interface Post {
  id: string;
  platform: Platform;
  author: { name: string; handle: string; avatarUrl?: string };
  text: string;
  createdAt: string;
  url: string;
  media?: { type: 'image' | 'video'; thumbUrl: string }[];
  hashtags: string[];
  metrics?: { reposts?: number; likes?: number };
}


