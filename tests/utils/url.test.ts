import { describe, it, expect } from 'vitest';
import { cleanShareUrl, formatDisplayUrl, getHighResGoogleImageUrl } from '@/utils/url';

describe('URL 清洗与规范化工具测试', () => {
  describe('formatDisplayUrl', () => {
    it.each([
      ['https://www.zhihu.com/question/2093162256385286282/answer/2095124418427084870', 'zhihu.com/question/2093162256385286282/answer/2095124418427084870'],
      ['http://www.example.com/article?id=42#section', 'example.com/article?id=42#section'],
      ['https://x.com/user/status/123', 'x.com/user/status/123'],
      ['https://mp.weixin.qq.com/s?__biz=abc&mid=123&idx=1&sn=xyz', 'mp.weixin.qq.com/s?__biz=abc&mid=123&idx=1&sn=xyz'],
      ['HTTPS://WWW.EXAMPLE.COM/a%2Fb?next=https://www.example.com', 'EXAMPLE.COM/a%2Fb?next=https://www.example.com'],
      ['example.com/article', 'example.com/article'],
      ['', ''],
    ])('formats %s without changing the path, query or fragment', (input, expected) => {
      expect(formatDisplayUrl(input)).toBe(expected);
    });
  });

  describe('cleanShareUrl', () => {
    it('清洗知乎链接中的所有营销追踪与会话参数', () => {
      const raw = 'https://www.zhihu.com/question/12345/answer/67890?utm_source=wechat&utm_medium=social&utm_campaign=share&utm_term=qa';
      expect(cleanShareUrl(raw)).toBe('https://www.zhihu.com/question/12345/answer/67890');
    });

    it('清洗 X/Twitter 推文链接中的追踪与分享 query', () => {
      const raw = 'https://x.com/elonmusk/status/123456789?t=ABC123xyz&s=19&ref_src=twsrc%5Etfw';
      expect(cleanShareUrl(raw)).toBe('https://x.com/elonmusk/status/123456789');
    });

    it('通用站点移除常见 tracking 参数，保留非追踪 query', () => {
      const raw = 'https://example.com/blog/article?id=42&utm_source=newsletter&fbclid=IwAR123';
      expect(cleanShareUrl(raw)).toBe('https://example.com/blog/article?id=42');
    });

    it('处理空字符串与非法 URL 兜底', () => {
      expect(cleanShareUrl('')).toBe('');
      expect(cleanShareUrl('not a valid url?foo=bar')).toBe('not a valid url');
    });
  });

  describe('getHighResGoogleImageUrl', () => {
    it('自动升级 Google / Gemini 图片尺寸修饰符为原图 s0', () => {
      const thumbUrl = 'https://lh3.googleusercontent.com/a/ACg8ocLxyz=s96-c';
      expect(getHighResGoogleImageUrl(thumbUrl)).toContain('=s0');
    });

    it('非 Google 域名原样返回', () => {
      const normalUrl = 'https://example.com/pic.png';
      expect(getHighResGoogleImageUrl(normalUrl)).toBe(normalUrl);
    });
  });
});
