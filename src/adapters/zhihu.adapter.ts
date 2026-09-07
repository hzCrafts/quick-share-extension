import { BaseAdapter, type OnShareTrigger } from './base';
import type { PostData, PostMedia } from '@/types/post';

export class ZhihuAdapter extends BaseAdapter {
  readonly platform = 'zhihu';
  readonly name = '知乎 (Zhihu)';
  private observer: MutationObserver | null = null;
  private onShareCallback: OnShareTrigger | null = null;

  match(url: URL): boolean {
    return url.hostname.includes('zhihu.com');
  }

  start(onShare: OnShareTrigger): void {
    this.onShareCallback = onShare;
    this.scanAndInject();

    this.observer = new MutationObserver(() => {
      this.scanAndInject();
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    document.querySelectorAll('.quick-share-zhihu-wrapper').forEach((el) => el.remove());
  }

  private scanAndInject(): void {
    // 1. 适配回答项 / 列表项
    const answerItems = document.querySelectorAll<HTMLElement>('.ContentItem, .AnswerItem, .TopstoryItem');
    answerItems.forEach((item) => {
      const actions = item.querySelector<HTMLElement>('.ContentItem-actions');
      if (!actions || actions.querySelector('.quick-share-zhihu-wrapper')) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'quick-share-zhihu-wrapper';
      wrapper.style.display = 'inline-flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.marginLeft = '12px';

      const btn = this.createShareButton(async () => {
        const postData = await this.extract(item);
        if (postData && this.onShareCallback) {
          this.onShareCallback(postData);
        }
      }, '生成知乎分享卡片');

      btn.style.display = 'inline-flex';
      btn.style.alignItems = 'center';
      btn.style.gap = '4px';
      btn.style.background = 'transparent';
      btn.style.border = 'none';
      btn.style.cursor = 'pointer';
      btn.style.color = '#8590a6';
      btn.style.fontSize = '14px';
      btn.style.padding = '4px 8px';
      btn.style.borderRadius = '4px';
      btn.style.transition = 'color 0.2s';
      btn.innerHTML += '<span style="font-size: 13px; font-weight: 500;">卡片分享</span>';

      btn.onmouseenter = () => {
        btn.style.color = '#0066ff';
      };
      btn.onmouseleave = () => {
        btn.style.color = '#8590a6';
      };

      wrapper.appendChild(btn);
      actions.appendChild(wrapper);
    });

    // 2. 适配专栏文章页 (zhuanlan.zhihu.com)
    const articleHeader = document.querySelector<HTMLElement>('.Post-Header, .Post-NormalMain');
    if (articleHeader && !articleHeader.querySelector('.quick-share-zhihu-wrapper')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'quick-share-zhihu-wrapper';
      wrapper.style.margin = '12px 0';

      const btn = this.createShareButton(async () => {
        const postData = await this.extractArticle();
        if (postData && this.onShareCallback) {
          this.onShareCallback(postData);
        }
      }, '生成专栏文章卡片');

      btn.style.display = 'inline-flex';
      btn.style.alignItems = 'center';
      btn.style.gap = '6px';
      btn.style.background = '#f6f6f6';
      btn.style.border = '1px solid #ebebeb';
      btn.style.borderRadius = '6px';
      btn.style.padding = '6px 12px';
      btn.style.cursor = 'pointer';
      btn.style.color = '#121212';
      btn.innerHTML += '<span style="font-size: 13px; font-weight: 500;">生成分享卡片</span>';

      wrapper.appendChild(btn);
      articleHeader.prepend(wrapper);
    }
  }

  async extract(item: HTMLElement): Promise<PostData | null> {
    try {
      // 提取问题标题
      const titleEl = item.querySelector('.ContentItem-title, .QuestionItem-title') || document.querySelector('.QuestionHeader-title');
      const title = titleEl?.textContent?.trim() || '';

      // 提取作者信息
      const authorEl = item.querySelector('.AuthorInfo-name .UserLink-link');
      const name = authorEl?.textContent?.trim() || '匿名用户';
      const avatarEl = item.querySelector<HTMLImageElement>('.AuthorInfo-avatar, .Avatar');
      const avatarUrl = avatarEl?.src;

      // 提取正文
      const contentEl = item.querySelector('.RichContent-inner, .RichText');
      const content = contentEl?.textContent?.trim() || '';

      // 提取配图
      const mediaList: PostMedia[] = [];
      const imgEls = item.querySelectorAll<HTMLImageElement>('.RichContent-inner img, .RichText img');
      imgEls.forEach((img) => {
        const rawSrc = img.getAttribute('data-original') || img.getAttribute('data-actualsrc') || img.src;
        if (rawSrc && !rawSrc.includes('data:image/svg')) {
          mediaList.push({
            type: 'image',
            url: rawSrc,
          });
        }
      });

      // 原文链接
      const itemLink = item.querySelector<HTMLAnchorElement>('meta[itemprop="url"]') || item.querySelector<HTMLAnchorElement>('.ContentItem-title a');
      const postUrl = itemLink?.href || window.location.href;

      return {
        id: postUrl,
        platform: 'zhihu',
        url: postUrl,
        title: title || undefined,
        author: {
          name,
          handle: '知乎答主',
          avatarUrl,
        },
        content,
        media: mediaList.length > 0 ? mediaList : undefined,
        createdAt: new Date().toLocaleDateString('zh-CN'),
      };
    } catch (err) {
      console.error('[QuickShare] Failed to extract zhihu answer data:', err);
      return null;
    }
  }

  private async extractArticle(): Promise<PostData | null> {
    try {
      const title = document.querySelector('.Post-Title')?.textContent?.trim() || document.title;
      const authorEl = document.querySelector('.AuthorInfo-name .UserLink-link') || document.querySelector('.Post-Author');
      const name = authorEl?.textContent?.trim() || '知乎专栏作者';
      const avatarEl = document.querySelector<HTMLImageElement>('.AuthorInfo-avatar, .Avatar');
      const avatarUrl = avatarEl?.src;
      const contentEl = document.querySelector('.Post-RichText, .RichText');
      const content = contentEl?.textContent?.trim() || '';

      return {
        id: window.location.href,
        platform: 'zhihu',
        url: window.location.href,
        title,
        author: {
          name,
          handle: '知乎专栏',
          avatarUrl,
        },
        content,
        createdAt: new Date().toLocaleDateString('zh-CN'),
      };
    } catch (err) {
      console.error('[QuickShare] Failed to extract zhihu article data:', err);
      return null;
    }
  }
}
