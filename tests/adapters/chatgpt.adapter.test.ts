import { describe, it, expect, beforeEach } from 'vitest';
import { ChatGPTAdapter } from '@/adapters/chatgpt.adapter';
import { CHATGPT_CONVERSATION_HTML } from '../fixtures/chatgpt.fixture';

describe('ChatGPTAdapter 结构解析与数据提取测试', () => {
  let adapter: ChatGPTAdapter;

  beforeEach(() => {
    adapter = new ChatGPTAdapter();
    document.body.innerHTML = '';
  });

  describe('1. 路由与 URL 匹配', () => {
    it('匹配 chatgpt.com 和 chat.openai.com', () => {
      expect(adapter.match(new URL('https://chatgpt.com/c/123-abc'))).toBe(true);
      expect(adapter.match(new URL('https://chat.openai.com/g/g-abc'))).toBe(true);
      expect(adapter.match(new URL('https://google.com'))).toBe(false);
    });
  });

  describe('2. Assistant 对话 Turn 解析提取', () => {
    it('从前序 User Turn 提取用户 Prompt 作为 Title，并保真提取 Assistant 各种 Markdown 结构', async () => {
      document.body.innerHTML = CHATGPT_CONVERSATION_HTML;
      const assistantTurn = document.querySelector<HTMLElement>('article[data-testid="conversation-turn-2"]')!;
      expect(assistantTurn).not.toBeNull();

      const postData = await adapter.extract(assistantTurn);
      expect(postData).not.toBeNull();

      // 验证 Title 契约：提取用户提问 Prompt
      expect(postData?.title).toBe('请解释 Rust 所有权与生命周期机制');
      expect(postData?.platform).toBe('chatgpt');
      expect(postData?.author.name).toBe('ChatGPT');

      // 验证正文 DOM 结构
      const contentContainer = document.createElement('div');
      contentContainer.innerHTML = postData!.contentHtml;

      // 1. 标题与段落
      expect(contentContainer.querySelector('h3')?.textContent).toContain('所有权三大核心规则');
      expect(contentContainer.querySelectorAll('p').length).toBeGreaterThanOrEqual(2);

      // 2. 列表结构
      const listItems = contentContainer.querySelectorAll('ul li');
      expect(listItems.length).toBe(3);
      expect(listItems[0].textContent).toContain('所有者');

      // 3. 代码块结构与语言标记
      const pre = contentContainer.querySelector('pre');
      const code = contentContainer.querySelector('code');
      expect(pre).not.toBeNull();
      expect(code?.className).toContain('language-rust');
      expect(code?.textContent).toContain('let s1 = String::from("hello");');

      // 4. 表格结构
      const table = contentContainer.querySelector('table');
      expect(table).not.toBeNull();
      expect(table?.querySelectorAll('tbody tr').length).toBe(2);

      // 5. 操作栏按钮被完全排除
      expect(contentContainer.querySelector('button')).toBeNull();
      expect(contentContainer.querySelector('[data-testid="copy-turn-action-button"]')).toBeNull();
    });
  });

  describe('3. 选区与 Entity 边界判定', () => {
    it('精确识别 Assistant 内部节点，排除侧边栏与用户自身节点', () => {
      document.body.innerHTML = CHATGPT_CONVERSATION_HTML;
      const codeNode = document.querySelector('code')!;
      const userNode = document.querySelector('.user-message-container')!;

      const foundEntity = adapter.findEntityFromNode(codeNode);
      expect(foundEntity).not.toBeNull();
      expect(foundEntity?.getAttribute('data-testid')).toBe('conversation-turn-2');

      const userEntity = adapter.findEntityFromNode(userNode);
      expect(userEntity).toBeNull();
    });
  });
});
