import { describe, expect, it } from 'vitest';
import { compactExcerptContext, compactInlineExcerpt, prepareExcerpt } from '@/utils/excerpt';

const parse = (html: string) => {
  const node = document.createElement('div');
  node.innerHTML = html;
  return node;
};
describe('excerpt context limits', () => {
  it('keeps the nearest text on each side of a long article', () => {
    const before = compactExcerptContext(
      `<p>${'远处前文'.repeat(200)}<strong>紧邻选区</strong></p>`,
      'before'
    );
    const after = compactExcerptContext(
      `<p><em>紧邻下文</em>${'远处下文'.repeat(200)}</p>`,
      'after'
    );
    expect(parse(before).textContent?.length).toBeLessThanOrEqual(64);
    expect(parse(before).textContent).toMatch(/紧邻选区$/);
    expect(parse(before).querySelector('strong')?.textContent).toBe('紧邻选区');
    expect(parse(after).textContent).toMatch(/^紧邻下文/);
    expect(parse(after).textContent?.length).toBeLessThanOrEqual(64);
    expect(parse(after).querySelector('em')?.textContent).toBe('紧邻下文');
  });
  it('bounds explicit newlines even when a platform puts the whole article in one block', () => {
    expect(
      parse(compactExcerptContext('一<br>二<br>三<br>四', 'before')).textContent
    ).toBe('三四');
    expect(
      parse(compactExcerptContext('一<br>二<br>三<br>四', 'after')).textContent
    ).toBe('一二');
    expect(
      parse(compactExcerptContext('前文\n\n最后一句', 'before')).textContent
    ).toContain('最后一句');
  });
  it('never clips or reorders selected rich text', () => {
    const selected =
      '<span class="quick-share-spotlight">选中<strong>重点</strong><br>下一行<img src="data:image/png;base64,AA"></span>';
    const result = parse(
      compactInlineExcerpt(
        `<div><span class="quick-share-inline-fade-in">${'前'.repeat(2000)}</span>${selected}<span class="quick-share-inline-fade-out">${'后'.repeat(2000)}</span></div>`
      )
    );
    expect(result.querySelector('.quick-share-spotlight')?.outerHTML).toBe(
      selected
    );
    expect(
      result.querySelector('.quick-share-inline-fade-in')?.textContent?.length
    ).toBe(64);
    expect(
      result.querySelector('.quick-share-inline-fade-out')?.textContent?.length
    ).toBe(64);
  });
  it('preserves the word or line boundary touching the selection', () => {
    const result = parse(
      compactInlineExcerpt(
        '<span class="quick-share-inline-fade-in">previous </span><span class="quick-share-spotlight">selected</span><span class="quick-share-inline-fade-out"><br><br>next</span>'
      )
    );
    expect(
      result.querySelector('.quick-share-inline-fade-in')?.textContent
    ).toBe('previous ');
    expect(
      result.querySelector('.quick-share-inline-fade-out')?.firstChild?.nodeName
    ).toBe('BR');
    expect(
      result.querySelectorAll('.quick-share-inline-fade-out br')
    ).toHaveLength(1);
  });
  it('can hide context without losing the selection', () => {
    const result = compactInlineExcerpt(
      '<p><span class="quick-share-inline-fade-in">前文</span><span class="quick-share-spotlight"><em>保留</em></span><span class="quick-share-inline-fade-out">后文</span></p>',
      false
    );
    expect(parse(result).textContent).toBe('保留');
    expect(result).toContain('<em>保留</em>');
  });
  it('does not split surrogate pairs and drops context-only media', () => {
    const result = parse(
      compactExcerptContext('<p>🙂🙂🙂<img src="a">🙂🙂</p>', 'before', 3)
    );
    expect(result.textContent).toBe('🙂🙂🙂');
    expect(result.querySelector('img')).toBeNull();
    expect(compactExcerptContext('<br><img src="a">', 'after')).toBe('');
  });
});

 describe('two-line excerpt context preparation', () => {
  it('moves inline context around the untouched selected markup and retains enough text to fill two lines', () => {
    const selected = '<span class="quick-share-spotlight"><strong>重点</strong><br>下一行</span>';
    const result = prepareExcerpt('<span class="quick-share-inline-fade-in">紧邻前文</span>' + selected + '<span class="quick-share-inline-fade-out">紧邻后文</span>', '<p>' + '前'.repeat(600) + '</p>', '<p>' + '后'.repeat(600) + '</p>');
    expect(result.content).toBe(selected);
    expect(result.before.endsWith('紧邻前文')).toBe(true);
    expect(result.after.startsWith('紧邻后文')).toBe(true);
    expect(result.before.length).toBe(512);
    expect(result.after.length).toBe(512);
  });
  it('skips blank context lines and never invents missing context', () => {
    const result = prepareExcerpt('选区', '', '<p>一句</p><br><br><p>二句</p>');
    expect(result.before).toBe('');
    expect(result.after).toBe('一句\n二句');
  });
});
