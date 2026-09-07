import { BaseAdapter, type OnShareTrigger } from './base';
import type { PostData, PostMedia } from '@/types/post';
import { cleanShareUrl } from '@/utils/url';

export class XAdapter extends BaseAdapter {
  readonly platform = 'x';
  readonly name = 'X';
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
        // 1. 确保长推文「显示更多」被点击并展开全文
        await this.ensureExpanded(tweet);
        const postData = await this.extract(tweet);
        if (postData && this.onShareCallback) {
          this.onShareCallback(postData);
        }
      }, 'QuickShare');

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

  /**
   * 检查长推文是否有「Show more / 显示更多」，若有则自动点击展开
   */
  private async ensureExpanded(tweet: HTMLElement): Promise<void> {
    const showMoreSelectors = [
      'button[data-testid="tweet-text-show-more-link"]',
      'div[data-testid="tweetText"] + div[role="button"]',
      'div[role="button"][tabindex="0"]',
    ];

    for (const selector of showMoreSelectors) {
      const candidates = tweet.querySelectorAll<HTMLElement>(selector);
      for (const btn of candidates) {
        const text = btn.textContent?.trim().toLowerCase() || '';
        if (text.includes('show more') || text.includes('显示更多') || text.includes('展开')) {
          btn.click();
          await new Promise<void>((resolve) => setTimeout(resolve, 150));
          return;
        }
      }
    }
  }

  async extract(tweet: HTMLElement): Promise<PostData | null> {
    try {
      // 提取作者信息
      const userNameEl = tweet.querySelector('div[data-testid="User-Name"]');
      let name = 'Unknown';
      let handle = '';
      if (userNameEl) {
        const links = userNameEl.querySelectorAll('a');
        if (links.length > 0) {
          name = links[0]?.textContent?.trim() || 'Unknown';
          const handleCandidate = links[1]?.textContent?.trim() || links[0]?.getAttribute('href')?.replace('/', '@') || '';
          handle = handleCandidate.startsWith('@') ? handleCandidate : `@${handleCandidate}`;
        } else {
          const parts = userNameEl.textContent?.split('@') || [];
          name = parts[0]?.trim() || 'Unknown';
          if (parts[1]) {
            handle = '@' + parts[1].split('·')[0]?.trim();
          }
        }
      }

      const avatarEl = tweet.querySelector<HTMLImageElement>('div[data-testid="Tweet-User-Avatar"] img');
      const avatarUrl = avatarEl?.src;

      // 提取时间与原文链接并清洗
      const timeEl = tweet.querySelector('time');
      const timeParentLink = timeEl?.closest('a');
      const rawUrl = timeParentLink ? (timeParentLink as HTMLAnchorElement).href : window.location.href;
      const cleanUrl = cleanShareUrl(rawUrl);

      // 1. 提取当前 Post 的正文（忽略引用推文/转推原帖的内容）
      // 查找内嵌引用卡片容器
      const quoteCard = tweet.querySelector('div[aria-labelledby*="id__"], div[role="link"]');
      
      // 取第一个属于本推文的 tweetText
      const tweetTextEl = tweet.querySelector<HTMLElement>('div[data-testid="tweetText"]');
      let content = '';

      if (tweetTextEl) {
        const clone = tweetTextEl.cloneNode(true) as HTMLElement;
        // 遍历处理链接，还原为真实 URL
        const links = clone.querySelectorAll<HTMLAnchorElement>('a');
        links.forEach((a) => {
          const href = a.getAttribute('href') || '';
          const text = a.textContent?.trim() || '';
          // 如果是 @用户 或 #话题，保留原样
          if (text.startsWith('@') || text.startsWith('#')) {
            return;
          }
          let actualUrl = a.title || href;
          if (actualUrl.startsWith('/')) {
            actualUrl = `https://x.com${actualUrl}`;
          }
          const span = document.createElement('span');
          span.textContent = ` ${actualUrl} `;
          a.replaceWith(span);
        });

        content = clone.textContent?.trim() || '';
      }

      // 2. 检查是否有 video 标签或视频播放器，将视频 URL 附在正文里
      const hasVideo = tweet.querySelector('video, div[data-testid="videoComponent"], div[data-testid="videoPlayer"]');
      if (hasVideo) {
        const videoEl = tweet.querySelector<HTMLVideoElement>('video');
        const videoSrc = videoEl?.src && !videoEl.src.startsWith('blob:') ? videoEl.src : cleanUrl;
        content += `\n\n[视频]: ${videoSrc}`;
      }

      // 3. 提取当前 Post 自身的媒体图片（排除 quoteTweet 内嵌卡片中的图片）
      const mediaList: PostMedia[] = [];
      const quoteContainer = tweet.querySelector('div[data-testid="quoteTweet"], [data-testid="card.layoutLarge.detail"]');
      const photoEls = tweet.querySelectorAll<HTMLImageElement>('div[data-testid="tweetPhoto"] img, img[src*="pbs.twimg.com/media/"]');

      photoEls.forEach((img) => {
        // 如果图片处于被引用推文容器内部，则忽略
        if (quoteContainer && quoteContainer.contains(img)) {
          return;
        }
        // 排除 emoji 表情与用户头像
        if (img.src && !img.src.includes('emoji') && !img.src.includes('profile_images')) {
          let highResUrl = img.src;
          if (highResUrl.includes('name=')) {
            highResUrl = highResUrl.replace(/name=[a-zA-Z0-9_]+/, 'name=large');
          }
          if (!mediaList.some((m) => m.url === highResUrl)) {
            mediaList.push({
              type: 'image',
              url: highResUrl,
            });
          }
        }
      });

      return {
        id: cleanUrl,
        platform: 'x',
        url: cleanUrl,
        author: {
          name,
          handle,
          avatarUrl,
        },
        content,
        media: mediaList.length > 0 ? mediaList : undefined,
      };
    } catch (err) {
      console.error('[QuickShare] Failed to extract tweet data:', err);
      return null;
    }
  }
}
