import { BaseAdapter, type OnShareTrigger } from './base';
import type { PostData } from '@/types/post';

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
    // 1. 适配回答项 / 列表流 (AnswerItem, TopstoryItem, PinItem)
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
        // 先确保自动展开全文
        await this.ensureExpanded(item);
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
    const articleHeader = document.querySelector<HTMLElement>('.Post-Header, .Post-NormalMain, .Post-Main');
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

  /**
   * 检查知乎回答是否折叠，若折叠则自动点击展开并等待完整内容加载
   */
  private async ensureExpanded(item: HTMLElement): Promise<void> {
    const isCollapsed = item.querySelector('.RichContent.is-collapsed') || item.classList.contains('is-collapsed');
    const moreBtn = item.querySelector<HTMLButtonElement>('.ContentItem-more, button.RichContent-collapsedText');

    if (isCollapsed && moreBtn) {
      moreBtn.click();

      // 等待 DOM 展开完成（等待 is-collapsed 类移除或高度变化）
      await new Promise<void>((resolve) => {
        let attempts = 0;
        const check = () => {
          attempts++;
          const stillCollapsed = item.querySelector('.RichContent.is-collapsed');
          if (!stillCollapsed || attempts > 15) {
            resolve();
          } else {
            setTimeout(check, 50);
          }
        };
        setTimeout(check, 50);
      });
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
      const headlineEl = item.querySelector('.AuthorInfo-badgeText, .AuthorInfo-detail');
      const handle = headlineEl?.textContent?.trim() || '知乎答主';

      const avatarEl = item.querySelector<HTMLImageElement>('.AuthorInfo-avatar, .Avatar');
      const avatarUrl = avatarEl?.src;

      // 提取富文本内容并清洗
      const richContentEl = item.querySelector<HTMLElement>('.RichContent-inner, .RichText');
      if (!richContentEl) return null;

      const contentHtml = this.cleanZhihuHtml(richContentEl);
      const content = richContentEl.textContent?.trim() || '';

      // 提取原文链接
      const itemLink = item.querySelector<HTMLAnchorElement>('meta[itemprop="url"]') || item.querySelector<HTMLAnchorElement>('.ContentItem-title a');
      const postUrl = itemLink?.href || window.location.href;

      // 提取时间
      const timeEl = item.querySelector('.ContentItem-time, [itemprop="dateModified"], [itemprop="dateCreated"]');
      const createdAt = timeEl?.textContent?.replace('发布于 ', '')?.trim() || new Date().toLocaleDateString('zh-CN');

      return {
        id: postUrl,
        platform: 'zhihu',
        url: postUrl,
        title: title || undefined,
        author: {
          name,
          handle,
          avatarUrl,
        },
        content,
        contentHtml,
        createdAt,
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
      const richContentEl = document.querySelector<HTMLElement>('.Post-RichText, .RichText');
      if (!richContentEl) return null;

      const contentHtml = this.cleanZhihuHtml(richContentEl);
      const content = richContentEl.textContent?.trim() || '';

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
        contentHtml,
        createdAt: new Date().toLocaleDateString('zh-CN'),
      };
    } catch (err) {
      console.error('[QuickShare] Failed to extract zhihu article data:', err);
      return null;
    }
  }

  /**
   * 清洗知乎 DOM，生成保真度高、图文混排结构完整的高清 HTML
   */
  private cleanZhihuHtml(rawEl: HTMLElement): string {
    const clone = rawEl.cloneNode(true) as HTMLElement;

    // 1. 移除无关噪音标签
    const removeSelectors = [
      '.ContentItem-more',
      '.RichContent-collapsedText',
      '.Button--plain',
      '.LinkCard-content',
      'button',
      'noscript',
      '.css-1g4ba74',
    ];
    removeSelectors.forEach((sel) => {
      clone.querySelectorAll(sel).forEach((el) => el.remove());
    });

    // 2. 遍历处理所有图片，保留原位顺序并替换为高清原图
    const images = clone.querySelectorAll<HTMLImageElement>('img');
    images.forEach((img) => {
      // 知乎真实高清大图通常在 data-original 或 data-actualsrc
      const realSrc = 
        img.getAttribute('data-original') || 
        img.getAttribute('data-actualsrc') || 
        img.getAttribute('data-rawwidth') && img.src ||
        img.src;

      if (realSrc && !realSrc.startsWith('data:image/svg')) {
        img.src = realSrc;
        // 清理原有内联写死的高度/宽度
        img.removeAttribute('style');
        img.removeAttribute('width');
        img.removeAttribute('height');
        img.className = 'quick-share-rich-img';
        img.setAttribute('crossorigin', 'anonymous');
      } else if (realSrc.includes('emoji')) {
        // 表情图片
        img.className = 'inline-block w-4 h-4 align-text-bottom mx-0.5';
      }
    });

    // 3. 规范化段落与结构
    return clone.innerHTML;
  }
}
