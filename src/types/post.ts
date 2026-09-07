export type PlatformType = 'x' | 'zhihu' | 'jike' | 'weibo' | 'universal';

export interface PostAuthor {
  name: string;
  handle?: string;
  avatarUrl?: string;
  verified?: boolean;
}

export interface PostMedia {
  type: 'image' | 'video';
  url: string;
}

export interface PostData {
  id: string;
  platform: PlatformType;
  url: string;
  author: PostAuthor;
  title?: string;
  content: string;
  contentHtml?: string;
  isExcerpt?: boolean;
  excerptBeforeHtml?: string;
  excerptAfterHtml?: string;
  media?: PostMedia[];
  createdAt?: string;
  stats?: {
    likes?: number | string;
    reposts?: number | string;
    comments?: number | string;
  };
}
