import { BaseAdapter, type OnShareTrigger, type ExcerptSelection } from './base';
import type { PostData, PostMedia } from '@/types/post';
import { cleanShareUrl } from '@/utils/url';
import { sanitizeHtmlForCard } from '@/utils/exporter';

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

  /**
   * 检查选区节点是否处于 X 推文容器内部
   */
  findEntityFromNode(node: Node): HTMLElement | null {
    const el = (node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement) as HTMLElement | null;
    if (!el) return null;
    return el.closest<HTMLElement>('article[data-testid="tweet"]');
  }

  /**
   * 获取 X 推文的正文根容器
   */
  getContentRootFromEntity(entity: HTMLElement): HTMLElement | null {
    return entity.querySelector<HTMLElement>('div[data-testid="tweetText"]') || entity;
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

      const btn = this.createShareButton(() => {
        if (this.onShareCallback) {
          this.onShareCallback(
            (async () => {
              await this.ensureExpanded(tweet);
              return this.extract(tweet);
            })()
          );
        }
      }, 'QuickShare 一键制图分享', 22);

      btn.style.background = 'transparent';
      btn.style.border = 'none';
      btn.style.cursor = 'pointer';
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.padding = '4px';
      btn.style.borderRadius = '9999px';
      btn.style.color = 'inherit';
      btn.style.transition = 'background-color 0.2s, transform 0.15s';
      btn.onmouseenter = () => {
        btn.style.backgroundColor = 'rgba(29, 155, 240, 0.12)';
        btn.style.transform = 'scale(1.08)';
      };
      btn.onmouseleave = () => {
        btn.style.backgroundColor = 'transparent';
        btn.style.transform = 'scale(1)';
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

  async extract(tweet?: HTMLElement, selection?: ExcerptSelection): Promise<PostData | null> {
    if (!tweet) return null;

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
      const avatarUrl = avatarEl?.getAttribute('src') || avatarEl?.src;

      // 提取时间与原文链接并清洗
      const timeEl = tweet.querySelector('time');
      const timeParentLink = timeEl?.closest('a');
      let rawUrl = timeParentLink ? (timeParentLink.getAttribute('href') || timeParentLink.href) : window.location.href;
      if (rawUrl.startsWith('/')) {
        rawUrl = `https://x.com${rawUrl}`;
      }
      const cleanUrl = cleanShareUrl(rawUrl);

      // 1. 提取正文内容与富文本 HTML
      let content = '';
      let contentHtml: string | undefined = undefined;
      let excerptBeforeHtml: string | undefined = undefined;
      let excerptAfterHtml: string | undefined = undefined;
      const isExcerpt = Boolean(selection);

      if (selection) {
        // 划选引述模式：保留富文本结构并提取前后上下文
        content = selection.selectedText.trim();
        const temp = document.createElement('div');
        temp.innerHTML = selection.selectedHtml || selection.selectedText.trim();
        this.convertNewlinesToBr(temp);
        contentHtml = sanitizeHtmlForCard(temp.innerHTML);

        if (selection.beforeHtml) {
          const beforeTemp = document.createElement('div');
          beforeTemp.innerHTML = selection.beforeHtml;
          this.convertNewlinesToBr(beforeTemp);
          excerptBeforeHtml = sanitizeHtmlForCard(beforeTemp.innerHTML);
        }
        if (selection.afterHtml) {
          const afterTemp = document.createElement('div');
          afterTemp.innerHTML = selection.afterHtml;
          this.convertNewlinesToBr(afterTemp);
          excerptAfterHtml = sanitizeHtmlForCard(afterTemp.innerHTML);
        }
      } else {
        const tweetTextEl = tweet.querySelector<HTMLElement>('div[data-testid="tweetText"]');
        if (tweetTextEl) {
          const clone = tweetTextEl.cloneNode(true) as HTMLElement;
          const links = clone.querySelectorAll<HTMLAnchorElement>('a');
          links.forEach((a) => {
            const href = a.getAttribute('href') || '';
            const text = a.textContent?.trim() || '';
            if (text.startsWith('@') || text.startsWith('#')) return;
            let actualUrl = a.title || href;
            if (actualUrl.startsWith('/')) {
              actualUrl = `https://x.com${actualUrl}`;
            }
            const span = document.createElement('span');
            span.textContent = ` ${actualUrl} `;
            a.replaceWith(span);
          });

          // 将 X 原生文本节点中的 \n 换行符显式转换为 <br />，确保排版换行 100% 保真
          this.convertNewlinesToBr(clone);

          // 处理推文内嵌表情 emoji <img> 保持行内尺寸与对齐
          clone.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
            if (img.src && (img.src.includes('emoji') || img.alt)) {
              img.className = 'inline-block w-4 h-4 align-text-bottom mx-0.5';
            }
          });

          content = clone.textContent?.trim() || '';
          contentHtml = sanitizeHtmlForCard(clone.innerHTML);
        }

        // 检查 video
        const hasVideo = tweet.querySelector('video, div[data-testid="videoComponent"], div[data-testid="videoPlayer"]');
        if (hasVideo) {
          const videoEl = tweet.querySelector<HTMLVideoElement>('video');
          const videoSrc = videoEl?.src && !videoEl.src.startsWith('blob:') ? videoEl.src : cleanUrl;
          content += `\n\n[视频]: ${videoSrc}`;
        }

        // 检查 Link Card / 网页链接卡片
        const cardEl = tweet.querySelector<HTMLElement>(
          'div[data-testid="card.wrapper"], [data-testid="card.layoutLarge.detail"], [data-testid="card.layoutSmall.detail"], div[data-testid="linkCard"], a[target="_blank"][role="link"]'
        );
        let cardUrl = '';
        if (cardEl) {
          const cardLink = cardEl.tagName.toLowerCase() === 'a' ? (cardEl as HTMLAnchorElement) : cardEl.querySelector<HTMLAnchorElement>('a[href]');
          if (cardLink) {
            const rawCardHref = cardLink.getAttribute('href') || cardLink.title || '';
            if (rawCardHref && (rawCardHref.startsWith('http') || !rawCardHref.startsWith('/'))) {
              cardUrl = cleanShareUrl(rawCardHref);
            }
          }
        }

        // 如果正文中未包含卡片链接，则附在正文末尾（排版位于图片上方）
        if (cardUrl && !content.includes(cardUrl)) {
          content = content ? `${content}\n\n${cardUrl}` : cardUrl;
          if (contentHtml) {
            contentHtml += `<p><a href="${cardUrl}">${cardUrl}</a></p>`;
          }
        }
      }

      // 2. 提取媒体图片（包含推文配图与 Link Card 预览大图）
      let mediaList: PostMedia[] | undefined = undefined;
      if (!selection) {
        // 仅排除引用推文（Quote Tweet）内的配图，不排除当前推文的 Link Card
        const quoteContainer = tweet.querySelector('div[data-testid="quoteTweet"]');
        const photoEls = tweet.querySelectorAll<HTMLImageElement>(
          'div[data-testid="tweetPhoto"] img, img[src*="pbs.twimg.com/media/"], img[src*="pbs.twimg.com/card_img/"], div[data-testid="card.wrapper"] img, [data-testid="card.layoutLarge.detail"] img'
        );
        const list: PostMedia[] = [];

        photoEls.forEach((img) => {
          if (quoteContainer && quoteContainer.contains(img)) return;
          if (img.src && !img.src.includes('emoji') && !img.src.includes('profile_images')) {
            let highResUrl = img.src;
            if (highResUrl.includes('name=')) {
              highResUrl = highResUrl.replace(/name=[a-zA-Z0-9_]+/, 'name=large');
            }
            if (!list.some((m) => m.url === highResUrl)) {
              list.push({
                type: 'image',
                url: highResUrl,
              });
            }
          }
        });
        if (list.length > 0) mediaList = list;
      }

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
        contentHtml,
        isExcerpt,
        excerptBeforeHtml,
        excerptAfterHtml,
        media: mediaList,
      };
    } catch (err) {
      console.error('[QuickShare] Failed to extract tweet data:', err);
      return null;
    }
  }

  /**
   * 将 X (Twitter) 原生文本节点中的 \n 换行符显式转换为 <br />，确保排版换行 100% 保真
   */
  private convertNewlinesToBr(root: HTMLElement): void {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode as Text);
    }

    textNodes.forEach((node) => {
      if (!node.nodeValue || !node.nodeValue.includes('\n')) return;

      // 如果是处于容器首尾两端的纯缩进空白节点，直接移除
      if (node.nodeValue.trim() === '') {
        if (!node.previousSibling || !node.nextSibling) {
          node.remove();
          return;
        }
      }

      const fragment = document.createDocumentFragment();
      const parts = node.nodeValue.split('\n');
      parts.forEach((part, index) => {
        if (index > 0) {
          fragment.appendChild(document.createElement('br'));
        }
        if (part) {
          fragment.appendChild(document.createTextNode(part));
        }
      });
      node.parentNode?.replaceChild(fragment, node);
    });
  }
}
