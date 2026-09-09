import { describe, it, expect, beforeEach } from 'vitest';
import { GeminiAdapter } from '@/adapters/gemini.adapter';
import { GEMINI_CONVERSATION_HTML } from '../fixtures/gemini.fixture';

describe('GeminiAdapter 结构解析与数据提取测试', () => {
  let adapter: GeminiAdapter;

  beforeEach(() => {
    adapter = new GeminiAdapter();
    document.body.innerHTML = '';
  });

  describe('1. 路由与 URL 匹配', () => {
    it('匹配 gemini.google.com', () => {
      expect(adapter.match(new URL('https://gemini.google.com/app/123'))).toBe(true);
      expect(adapter.match(new URL('https://chatgpt.com'))).toBe(false);
    });
  });

  describe('2. Gemini 模型回复提取', () => {
    it('提取前序用户提问作为 Title，保真提取有序列表与 JSON 代码块', async () => {
      document.body.innerHTML = GEMINI_CONVERSATION_HTML;
      const modelTurn = document.querySelector<HTMLElement>('model-response')!;
      expect(modelTurn).not.toBeNull();

      const postData = await adapter.extract(modelTurn);
      expect(postData).not.toBeNull();

      expect(postData?.platform).toBe('gemini');
      expect(postData?.title).toBe('什么是 Web Extension Manifest V3 的主要改变？');
      expect(postData?.author.name).toBe('Gemini');

      const contentContainer = document.createElement('div');
      contentContainer.innerHTML = postData!.contentHtml;

      // 验证有序列表
      const ol = contentContainer.querySelector('ol');
      expect(ol).not.toBeNull();
      expect(ol?.querySelectorAll('li').length).toBe(3);

      // 验证代码块
      const code = contentContainer.querySelector('pre code');
      expect(code?.textContent).toContain('"manifest_version": 3');
    });
  });
});
