import { describe, expect, it } from 'vitest';
import { clampPreviewOffset } from '@/utils/preview';

describe('preview pan boundaries', () => {
  it('stops long images at both edges despite large wheel or drag deltas', () => {
    expect(clampPreviewOffset(10000, 2400, 600)).toBe(900);
    expect(clampPreviewOffset(-10000, 2400, 600)).toBe(-900);
    expect(clampPreviewOffset(350, 2400, 600)).toBe(350);
  });
  it('prevents horizontal movement at fitted width and centers smaller images', () => {
    expect(clampPreviewOffset(500, 640, 640)).toBe(0);
    expect(clampPreviewOffset(-500, 320, 640)).toBe(0);
  });
  it('uses updated bounds after scaling or viewport resizing', () => {
    expect(clampPreviewOffset(900, 1200, 600)).toBe(300);
    expect(clampPreviewOffset(-900, 1200, 800)).toBe(-200);
  });
});
