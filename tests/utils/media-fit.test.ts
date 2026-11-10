import { describe, expect, it } from 'vitest';
import { fitMediaRows } from '@/utils/media-fit';

describe('original attachment sizing', () => {
  it.each([3, 4, 5, 6, 9])('uses only two columns for X, including %s square frames', count => {
    const widths = fitMediaRows(Array(count).fill(1), 514, 6, 2);
    expect(widths).toHaveLength(count);
    widths.forEach(width => expect(width).toBe(254));
  });
  it('keeps different displayed ratios without distortion, with the last tile in one column', () => {
    const ratios = [1.2, .8, 1];
    const widths = fitMediaRows(ratios, 514, 6, 2);
    expect(widths[0] / ratios[0]).toBeCloseTo(widths[1] / ratios[1], 1);
    expect(widths[0] + widths[1] + 6).toBeCloseTo(514, 1);
    expect(widths[2]).toBe(254);
  });
  it('fits the reported two screenshots without cropping or a long single column', () => {
    const ratios = [1246 / 2048, 1155 / 2048];
    const widths = fitMediaRows(ratios, 514);
    expect(widths[0] + widths[1] + 6).toBeCloseTo(514, 1);
    expect(widths[0] / ratios[0]).toBeCloseTo(widths[1] / ratios[1], 1);
    expect(widths[0] / ratios[0]).toBeLessThan(514 * .9);
  });
  it.each([[16/9,9/16], [.1,.1], [4, .5, 1], [.5,1,2,1], [1,2,1,2,1,2]])('caps row heights and keeps aspect proportions: %s', (...ratios) => {
    const sizes = fitMediaRows(ratios, 514);
    expect(sizes).toHaveLength(ratios.length);
    for (let i = 0; i < sizes.length; i++) expect(sizes[i] / ratios[i]).toBeLessThanOrEqual(514 * .9);
  });
  it('fills the available width for a single attachment', () => expect(fitMediaRows([.3], 514)).toEqual([514]));
  it.each([undefined, 0, -1, NaN, Infinity])('rejects invalid dimensions: %s', value => {
    expect(fitMediaRows([value as number], 514)).toEqual([]);
  });
});
