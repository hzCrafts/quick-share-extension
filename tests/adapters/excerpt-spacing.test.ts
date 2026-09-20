import { beforeEach, describe, expect, it, vi } from 'vitest';
import { XAdapter } from '@/adapters/x.adapter';
import { ZhihuAdapter } from '@/adapters/zhihu.adapter';
import { ChatGPTAdapter } from '@/adapters/chatgpt.adapter';
import { GeminiAdapter } from '@/adapters/gemini.adapter';
import { prepareExcerpt } from '@/utils/excerpt';
import { X_TWEET_SIMPLE_HTML } from '../fixtures/x.fixture';
import { ZHIHU_ANSWER_HTML } from '../fixtures/zhihu.fixture';
import { CHATGPT_CONVERSATION_HTML } from '../fixtures/chatgpt.fixture';
import { GEMINI_CONVERSATION_HTML } from '../fixtures/gemini.fixture';

vi.mock('@/utils/exporter', async importOriginal => ({
  ...await importOriginal<typeof import('@/utils/exporter')>(),
  fetchImageAsDataUrl: vi.fn(async (url: string) => url),
}));

beforeEach(() => { document.body.innerHTML = ''; });

describe('Mixed text/image excerpt spacing across dedicated adapters', () => {
  it.each([
    ['X', new XAdapter(), X_TWEET_SIMPLE_HTML, 'article'],
    ['Zhihu', new ZhihuAdapter(), ZHIHU_ANSWER_HTML, '.AnswerItem'],
    ['ChatGPT', new ChatGPTAdapter(), CHATGPT_CONVERSATION_HTML, 'article[data-testid="conversation-turn-2"]'],
    ['Gemini', new GeminiAdapter(), GEMINI_CONVERSATION_HTML, 'model-response'],
  ] as const)('preserves explicit blank lines and zero spacing for %s', async (_name, adapter, fixture, selector) => {
    document.body.innerHTML = fixture;
    const selectedHtml = '<p style="margin-bottom:0px">First</p>\n<p style="margin-bottom:0px"><br></p>\n<figure style="margin-top:0px;margin-bottom:0px"><img src="https://example.com/figure.png"></figure>\n<p style="margin-top:0px">Caption</p>';
    const post = await adapter.extract(document.querySelector<HTMLElement>(selector)!, { selectedText: 'First\n\nCaption', selectedHtml });
    expect(post).not.toBeNull();
    const output = document.createElement('div');
    output.innerHTML = prepareExcerpt(post!.contentHtml!).content;
    expect(Array.from(output.children).map(el => el.tagName)).toEqual(['P', 'P', 'FIGURE', 'P']);
    expect(output.querySelectorAll('br')).toHaveLength(1);
    expect(output.querySelector('img')?.getAttribute('src')).toBe('https://example.com/figure.png');
    expect(output.querySelector('p')!.style.marginBottom).toBe('0px');
    expect(output.querySelector('figure')!.style.marginTop).toBe('0px');
  });
  it('keeps genuine X newlines within text and between inline spans', async () => {
    document.body.innerHTML = X_TWEET_SIMPLE_HTML;
    const post = await new XAdapter().extract(document.querySelector<HTMLElement>('article')!, {
      selectedText: 'First\nline\n\nLast',
      selectedHtml: '<span>First\nline</span>\n\n<span>Last</span>',
    });
    const output = document.createElement('div');
    output.innerHTML = prepareExcerpt(post!.contentHtml!).content;
    expect(output.querySelectorAll('br')).toHaveLength(3);
    expect(output.textContent).toBe('FirstlineLast');
  });

});
