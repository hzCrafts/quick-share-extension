import { describe, it, expect } from 'vitest';
import { formatPostDate, extractPostDate } from '@/utils/post-date';

describe('source dates', () => {
  it('uses English dates and twelve-hour time', () => {
    expect(formatPostDate('2026-09-17T10:30:00')).toBe('Sep 17, 2026 · 10:30 AM');
    expect(formatPostDate('2026-09-17')).toBe('Sep 17, 2026');
  });
  it('does not invent missing or invalid timestamps', () => {
    expect(formatPostDate()).toBe('');
    expect(formatPostDate('invalid')).toBe('');
    const root = document.createElement('div');
    root.innerHTML = '<span>2 hours ago</span>';
    expect(extractPostDate(root)).toBeUndefined();
  });
  it('extracts explicit publication metadata', () => {
    const root = document.createElement('div');
    root.innerHTML = '<meta itemprop="datePublished" content="2026-09-17T10:30:00+08:00">';
    expect(extractPostDate(root)).toBe('2026-09-17T10:30:00+08:00');
  });
});
