import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyCanvasBorderRadius } from '@/utils/exporter';

afterEach(() => vi.restoreAllMocks());

function setup(width: number, height: number) {
  const source = document.createElement('canvas');
  source.width = width; source.height = height;
  const result = document.createElement('canvas');
  const ctx = {
    beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), closePath: vi.fn(),
    clip: vi.fn(), drawImage: vi.fn(), roundRect: vi.fn(),
  };
  vi.spyOn(result, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
  const create = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag, options) =>
    tag === 'canvas' ? result : create(tag, options));
  return { source, result, ctx };
}

describe('exported corner geometry', () => {
  it('retains the circular crop for browsers without continuous corner support', () => {
    const { source, result, ctx } = setup(640, 400);
    expect(applyCanvasBorderRadius(source, 24)).toBe(result);
    expect(ctx.roundRect).toHaveBeenCalledWith(0, 0, 640, 400, 24);
    expect(ctx.clip).toHaveBeenCalledOnce();
    expect(ctx.drawImage).toHaveBeenCalledWith(source, 0, 0);
  });

  it('keeps all four continuous corners symmetric and joins the straight edges', () => {
    const { source, result, ctx } = setup(1600, 1000);
    applyCanvasBorderRadius(source, 81, 'superellipse(1.5)');
    expect([result.width, result.height]).toEqual([1600, 1000]);
    expect(ctx.roundRect).not.toHaveBeenCalled();
    const points = ctx.lineTo.mock.calls;
    const quarter = points.length / 4;
    expect(ctx.moveTo).toHaveBeenCalledWith(81, 0);
    expect(points[0]).toEqual([1519, 0]);
    expect(points[quarter]).toEqual([1600, 919]);
    expect(points[quarter * 2]).toEqual([81, 1000]);
    expect(points[quarter * 3]).toEqual([0, 81]);
    for (let i = 0; i < quarter; i++) {
      expect(points[i][0] + points[i + quarter * 2][0]).toBeCloseTo(1600);
      expect(points[i][1] + points[i + quarter * 2][1]).toBeCloseTo(1000);
    }
    expect(ctx.closePath).toHaveBeenCalledOnce();
    expect(ctx.clip).toHaveBeenCalledOnce();
    expect(ctx.drawImage).toHaveBeenCalledWith(source, 0, 0);
  });

  it('clamps large continuous corners to short image bounds', () => {
    const { source, ctx } = setup(80, 20);
    applyCanvasBorderRadius(source, 200, 'superellipse(1.5)');
    expect(ctx.moveTo).toHaveBeenCalledWith(10, 0);
    for (const [x, y] of ctx.lineTo.mock.calls) {
      expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThanOrEqual(80);
      expect(y).toBeGreaterThanOrEqual(0); expect(y).toBeLessThanOrEqual(20);
    }
  });
});
