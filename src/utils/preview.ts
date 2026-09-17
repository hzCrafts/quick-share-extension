/** Center smaller images; constrain larger images to their visible edges. */
export function clampPreviewOffset(offset: number, imageSize: number, viewportSize: number): number {
  const limit = Math.max(0, (imageSize - viewportSize) / 2);
  if (limit === 0) return 0;
  return Math.max(-limit, Math.min(limit, offset));
}
