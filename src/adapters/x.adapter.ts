import { BaseAdapter, type OnShareTrigger } from './base';
import type { PostData, PostMedia } from '@/types/post';

export class XAdapter extends BaseAdapter {
  readonly platform = 'x';
  readonly name = 'X (Twitter)';
  private observer: MutationObserver | null = null;
  private onShareCallback: OnShareTrigger | null = null;

  match(url: URL): boolean {
    return url.hostname === 'x.com' || url.hostname === 'twitter.com';
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
    document.querySelectorAll('.quick-share-x-wrapper').forEach((el) => el.remove());
  }

  private scanAndInject(): void {
    const tweets = document.querySelectorAll<HTMLElement>('article[data-testid="tweet"]');
    tweets.forEach((tweet) => {
      const actionGroup = tweet.querySelector<HTMLElement>('div[role="group"]');
      if (!actionGroup || actionGroup.querySelector('.quick-share-x-wrapper')) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'quick-share-x-wrapper';
      wrapper.style.display = 'inline-flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.justifyContent = 'center';
      wrapper.style.cursor = 'pointer';
      wrapper.style.padding = '0 6px';
      wrapper.style.color = 'rgb(113, 118, 123)';

      const btn = this.createShareButton(async () => {
        const postData = await this.extract(tweet);
        if (postData && this.onShareCallback) {
          this.onShareCallback(postData);
        }
      }, '生成推文分享卡片');

      // 调整按钮样式适配 Twitter 的 SVG 风格
      btn.style.background = 'transparent';
      btn.style.border = 'none';
      btn.style.cursor = 'pointer';
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.padding = '6px';
      btn.style.borderRadius = '9999px';
      btn.style.color = 'inherit';
      btn.style.transition = 'background-color 0.2s, color 0.2s';
      btn.onmouseenter = () => {
        btn.style.backgroundColor = 'rgba(29, 155, 240, 0.1)';
        btn.style.color = 'rgb(29, 155, 240)';
      };
      btn.onmouseleave = () => {
        btn.style.backgroundColor = 'transparent';
        btn.style.color = 'inherit';
      };

      wrapper.appendChild(btn);
      actionGroup.appendChild(wrapper);
    });
  }

  async extract(tweet: HTMLElement): Promise<PostData | null> {
    try {
      // 提取作者信息
      const userNameEl = tweet.querySelector('div[data-testid="User-Name"]');
      let name = 'Unknown';
      let handle = '';
      if (userNameEl) {
        const textParts = userNameEl.textContent?.split('@') || [];
        name = textParts[0]?.trim() || 'Unknown';
        if (textParts[1]) {
          handle = '@' + textParts[1].split('·')[0]?.trim();
        }
      }

      const avatarEl = tweet.querySelector<HTMLImageElement>('div[data-testid="Tweet-User-Avatar"] img');
      const avatarUrl = avatarEl?.src;

      // 提取正文文本
      const tweetTextEl = tweet.querySelector('div[data-testid="tweetText"]');
      const content = tweetTextEl?.textContent?.trim() || '';

      // 提取媒体图片
      const mediaList: PostMedia[] = [];
      const photoEls = tweet.querySelectorAll<HTMLImageElement>('div[data-testid="tweetPhoto"] img');
      photoEls.forEach((img) => {
        if (img.src && !img.src.includes('emoji')) {
          mediaList.push({
            type: 'image',
            url: img.src,
          });
        }
      });

      // 提取时间与原文链接
      const timeEl = tweet.querySelector('time');
      const timeParentLink = timeEl?.closest('a');
      const tweetUrl = timeParentLink ? (timeParentLink as HTMLAnchorElement).href : window.location.href;
      const createdAt = timeEl?.getAttribute('datetime') || new Date().toISOString();

      return {
        id: tweetUrl,
        platform: 'x',
        url: tweetUrl,
        author: {
          name,
          handle,
          avatarUrl,
        },
        content,
        media: mediaList.length > 0 ? mediaList : undefined,
        createdAt,
      };
    } catch (err) {
      console.error('[QuickShare] Failed to extract tweet data:', err);
      return null;
    }
  }
}
