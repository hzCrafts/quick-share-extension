export type PlatformType = 'x' | 'zhihu' | 'chatgpt' | 'gemini' | 'jike' | 'weibo' | 'universal';

export interface PostAuthor {
  name: string;
  handle?: string;
  avatarUrl?: string;
  verified?: boolean;
}

export interface PostMedia {
  type: 'image' | 'video';
  url: string;
  duration?: string;
  posterUrl?: string;
}

export interface PostContextThread {
  rootPost?: PostData;
  parentPost?: PostData;
}

export interface PostData {
  id: string;
  platform: PlatformType;
  url: string;
  author: PostAuthor;
  title?: string;
  promptHtml?: string;
  content: string;
  contentHtml?: string;
  isExcerpt?: boolean;
  excerptBeforeHtml?: string;
  excerptAfterHtml?: string;
  media?: PostMedia[];
  createdAt?: string;
  contextThread?: PostContextThread;
  parentThreadPost?: PostData;
  stats?: {
    likes?: number | string;
    reposts?: number | string;
    comments?: number | string;
  };
}
