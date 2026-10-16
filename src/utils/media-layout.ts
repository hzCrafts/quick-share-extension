import type { PostMedia } from '@/types/post';

/** Equal-height video pairs: widths are proportional to their source ratios. */
export function videoPairColumns(media: PostMedia[]): string | undefined {
  if (media.length !== 2 || !media.every(item => item.type === 'video' && Number.isFinite(item.aspectRatio) && item.aspectRatio! > 0)) return;
  return media.map(item => `minmax(0, ${item.aspectRatio}fr)`).join(' ');
}
