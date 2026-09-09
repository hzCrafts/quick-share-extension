import { describe, it, expect, beforeEach } from 'vitest';
import { ZhihuAdapter } from '@/adapters/zhihu.adapter';
import { ZHIHU_ANSWER_HTML, ZHIHU_ARTICLE_HTML } from '../fixtures/zhihu.fixture';

describe('ZhihuAdapter 结构解析与数据提取测试', () => {
  let adapter: ZhihuAdapter;

  beforeEach(() => {
    adapter = new ZhihuAdapter();
    document.body.innerHTML = '';
  });

  describe('1. 路由与 URL 匹配', () => {
    it('精确匹配知乎主站与专栏域名', () => {
      expect(adapter.match(new URL('https://www.zhihu.com/question/123/answer/456'))).toBe(true);
      expect(adapter.match(new URL('https://zhuanlan.zhihu.com/p/789012'))).toBe(true);
      expect(adapter.match(new URL('https://x.com/user/status/123'))).toBe(false);
    });
  });

  describe('2. 问答回答项 (AnswerItem) 解析提取', () => {
    it('正确提取问题标题、作者信息、清洁正文与高清图片', async () => {
      document.body.innerHTML = ZHIHU_ANSWER_HTML;
      const answerEl = document.querySelector<HTMLElement>('.AnswerItem')!;
      expect(answerEl).not.toBeNull();

      const postData = await adapter.extract(answerEl);
      expect(postData).not.toBeNull();

      // 验证元数据
      expect(postData?.platform).toBe('zhihu');
      expect(postData?.title).toBe('如何评价现代前端架构设计？');
      expect(postData?.author.name).toBe('资深工程师');
      expect(postData?.author.handle).toBe('全栈技术专家');
      expect(postData?.author.avatarUrl).toBe('https://picx.zhimg.com/v2-avatar_l.jpg');

      // 验证 URL 规范清洗 (移除了 utm_campaign, utm_source 等追踪参数)
      expect(postData?.url).toContain('/question/123456/answer/99887766');
      expect(postData?.url).not.toContain('utm_campaign');
      expect(postData?.url).not.toContain('utm_source');

      // 验证正文 DOM 结构与换行保真
      const contentContainer = document.createElement('div');
      contentContainer.innerHTML = postData!.contentHtml;

      const pTags = contentContainer.querySelectorAll('p');
      expect(pTags.length).toBeGreaterThanOrEqual(4);

      // 验证知乎知达实体词链接被清洗为干净纯文本 (消除了嵌套 svg 和 icon span)
      expect(contentContainer.querySelector('svg')).toBeNull();
      expect(contentContainer.querySelector('.zhida-icon-wrapper')).toBeNull();
      expect(contentContainer.textContent).toContain('TypeScript 提供了极高的类型安全性');

      // 验证图片自动升级提取 data-original 高清大图
      const img = contentContainer.querySelector('img');
      expect(img?.getAttribute('src')).toBe('https://picx.zhimg.com/v2-highres.png');
    });
  });

  describe('3. 专栏文章 (Article) 解析提取', () => {
    it('正确提取专栏文章标题、作者与引用块结构', async () => {
      document.body.innerHTML = ZHIHU_ARTICLE_HTML;
      const articleEl = document.querySelector<HTMLElement>('.Post-NormalMain')!;
      expect(articleEl).not.toBeNull();

      const postData = await adapter.extract(articleEl);
      expect(postData).not.toBeNull();

      expect(postData?.title).toBe('深入理解 Vite 与 WXT 扩展开发');
      expect(postData?.author.name).toBe('专栏作者');

      const contentContainer = document.createElement('div');
      contentContainer.innerHTML = postData!.contentHtml;

      // 验证引用块结构完整性
      const blockquote = contentContainer.querySelector('blockquote');
      expect(blockquote).not.toBeNull();
      expect(blockquote?.textContent).toContain('Vite 6 带来了极速的冷启动与 HMR 支持');
    });
  });

  describe('4. 金句引述 (Excerpt) 模式提取', () => {
    it('正确生成 spotlight-focus 与淡入淡出包装结构', async () => {
      document.body.innerHTML = ZHIHU_ANSWER_HTML;
      const answerEl = document.querySelector<HTMLElement>('.AnswerItem')!;

      const excerptSelection = {
        selectedText: '架构设计的核心在于抽象与长期可维护性。',
        selectedHtml: '<span class="spotlight-focus">架构设计的核心在于抽象与长期可维护性。</span>',
        beforeHtml: '<span class="fade-in-blur">第一段：</span>',
        afterHtml: '<span class="fade-out-blur">后面无关内容...</span>',
      };

      const postData = await adapter.extract(answerEl, excerptSelection);
      expect(postData).not.toBeNull();
      expect(postData?.isExcerpt).toBe(true);
      expect(postData?.content).toBe('架构设计的核心在于抽象与长期可维护性。');
      expect(postData?.contentHtml).toContain('spotlight-focus');
    });
  });
});
