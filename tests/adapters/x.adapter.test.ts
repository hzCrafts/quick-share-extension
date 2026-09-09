import { describe, it, expect, beforeEach } from 'vitest';
import { XAdapter } from '@/adapters/x.adapter';
import { X_TWEET_SIMPLE_HTML, X_TWEET_MULTILINE_IMAGES_HTML } from '../fixtures/x.fixture';

describe('XAdapter 结构解析与数据提取测试', () => {
  let adapter: XAdapter;

  beforeEach(() => {
    adapter = new XAdapter();
    document.body.innerHTML = '';
  });

  describe('1. 路由与 URL 匹配', () => {
    it('匹配 x.com 和 twitter.com', () => {
      expect(adapter.match(new URL('https://x.com/elonmusk/status/123'))).toBe(true);
      expect(adapter.match(new URL('https://twitter.com/elonmusk/status/123'))).toBe(true);
      expect(adapter.match(new URL('https://zhihu.com'))).toBe(false);
    });
  });

  describe('2. 推文数据提取与换行/图片保真', () => {
    it('正确提取单推文作者、handle、头像、正文及规范 URL', async () => {
      document.body.innerHTML = X_TWEET_SIMPLE_HTML;
      const tweetEl = document.querySelector<HTMLElement>('article[data-testid="tweet"]')!;
      expect(tweetEl).not.toBeNull();

      const postData = await adapter.extract(tweetEl);
      expect(postData).not.toBeNull();

      expect(postData?.platform).toBe('x');
      expect(postData?.author.name).toBe('Elon Musk');
      expect(postData?.author.handle).toBe('@elonmusk');
      expect(postData?.author.avatarUrl).toContain('avatar_normal.jpg');
      expect(postData?.contentHtml).toContain('Slow is Fast');
      
      // 验证 URL 剔除追踪参数
      expect(postData?.url).toBe('https://x.com/elonmusk/status/1234567890');
    });

    it('正确提取多段落换行推文与图片数组', async () => {
      document.body.innerHTML = X_TWEET_MULTILINE_IMAGES_HTML;
      const tweetEl = document.querySelector<HTMLElement>('article[data-testid="tweet"]')!;

      const postData = await adapter.extract(tweetEl);
      expect(postData).not.toBeNull();

      // 验证换行符 <br> 完整保留
      expect(postData?.contentHtml).toContain('<br');
      expect(postData?.contentHtml).toContain('First paragraph');
      expect(postData?.contentHtml).toContain('Second paragraph');

      // 验证多图解析与高清源升级
      expect(postData?.media?.length).toBe(2);
      expect(postData?.media?.[0].url).toContain('name=large');
      expect(postData?.media?.[1].url).toContain('name=large');
    });

    it('正确将 X 原生文本节点中的 \\n 转换为 <br /> 标签，避免排版合并坍缩', async () => {
      const rawTweetHtml = `
        <article data-testid="tweet">
          <div data-testid="User-Name">
            <a href="/author"><span>Author</span></a>
          </div>
          <div data-testid="tweetText">
            <span>第一行观点
第二行分析

第三行结论</span>
          </div>
          <a href="/author/status/2097150432996892889">
            <time datetime="2026-09-09T00:00:00.000Z">Sep 9</time>
          </a>
        </article>
      `;
      document.body.innerHTML = rawTweetHtml;
      const tweetEl = document.querySelector<HTMLElement>('article[data-testid="tweet"]')!;

      const postData = await adapter.extract(tweetEl);
      expect(postData).not.toBeNull();

      // 验证 contentHtml 内存在 3 个 <br> 换行
      const temp = document.createElement('div');
      temp.innerHTML = postData!.contentHtml!;

      const brTags = temp.querySelectorAll('br');
      expect(brTags.length).toBe(3);
      expect(postData?.contentHtml).toContain('第一行观点<br>第二行分析<br><br>第三行结论');
    });
  });
});
