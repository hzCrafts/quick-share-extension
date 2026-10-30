import type { PostMedia } from '@/types/post';

/** Equal-height video pairs: widths are proportional to their source ratios. */
export function videoPairColumns(media: PostMedia[]): string | undefined {
  if (media.length !== 2 || !media.every(item => item.type === 'video' && Number.isFinite(item.aspectRatio) && item.aspectRatio! > 0)) return;
  return media.map(item => `minmax(0, ${item.aspectRatio}fr)`).join(' ');
}

/** Shared by structured media and X's native quoted-post HTML. */
export function mediaLayoutClasses(media: PostMedia[]): Record<string, boolean> {
  return {
    'qs-media-mosaic': media.length > 1,
    'qs-media-three': media.length === 3,
    'qs-media-four': media.length === 4,
    'qs-media-many': media.length > 4,
    // Intrinsic sizing only works when both column ratios are available.
    // Mixed media and larger groups must keep the fixed mosaic tracks.
    'qs-media-video-pair': videoPairColumns(media) !== undefined,
  };
}
