import { BaseAdapter, type OnShareTrigger, type ExcerptSelection } from './base';
import type { PostData } from '@/types/post';
import { cleanShareUrl } from '@/utils/url';
import { sanitizeHtmlForCard, sanitizeDomForScreenshot, fetchImageAsDataUrl } from '@/utils/exporter';

export class ChatGPTAdapter extends BaseAdapter {
  readonly platform = 'chatgpt';
  readonly name = 'ChatGPT';
  private observer: MutationObserver | null = null;
  private onShareCallback: OnShareTrigger | null = null;

  match(url: URL): boolean {
    return url.hostname.includes('chatgpt.com') || url.hostname.includes('chat.openai.com');
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
    document.querySelectorAll('.quick-share-chatgpt-wrapper').forEach((el) => el.remove());
  }

  /**
   * 检查选区节点是否处于 ChatGPT Assistant 回答容器内
   */
  findEntityFromNode(node: Node): HTMLElement | null {
    const el = (node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement) as HTMLElement | null;
    if (!el) return null;

    // 排除左侧历史对话侧边栏与底部输入框
    if (el.closest('nav, #prompt-textarea, form')) {
      return null;
    }

    const turn = el.closest<HTMLElement>(
      'article[data-testid^="conversation-turn-"], div[data-message-author-role="assistant"], div.agent-turn, article'
    );
    if (!turn) return null;

    // 确保属于 Assistant 角色（排除纯 User 提问容器）
    if (
      turn.getAttribute('data-message-author-role') === 'assistant' ||
      turn.querySelector('[data-message-author-role="assistant"], .markdown')
    ) {
      if (el.closest('[data-message-author-role="user"]') && !el.closest('[data-message-author-role="assistant"]')) {
        return null;
      }
      return turn;
    }

    return null;
  }

  /**
   * 获取 ChatGPT Entity 内的正文根容器（即 Markdown 渲染区）
   */
  getContentRootFromEntity(entity: HTMLElement): HTMLElement | null {
    return (
      entity.querySelector<HTMLElement>('.markdown, div[data-message-author-role="assistant"] .markdown') ||
      entity.querySelector<HTMLElement>('div[data-message-author-role="assistant"]') ||
      entity
    );
  }

  private scanAndInject(): void {
    const turns = document.querySelectorAll<HTMLElement>(
      'article[data-testid^="conversation-turn-"], div[data-message-author-role="assistant"], article'
    );

    turns.forEach((turn) => {
      // 确认属于 Assistant 消息
      const isAssistant =
        turn.getAttribute('data-message-author-role') === 'assistant' ||
        turn.querySelector('[data-message-author-role="assistant"], .markdown');
      if (!isAssistant) return;

      // 寻找底部操作工具栏
      const actionsBar =
        turn.querySelector<HTMLElement>('div[data-testid*="action"], div.flex.gap-1, div.flex.items-center.gap-1') ||
        turn.querySelector<HTMLElement>('.markdown + div') ||
        turn.querySelector<HTMLElement>('div.mt-1.flex');

      if (!actionsBar || actionsBar.querySelector('.quick-share-chatgpt-wrapper')) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'quick-share-chatgpt-wrapper';
      wrapper.style.display = 'inline-flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.marginLeft = '4px';

      const btn = this.createShareButton(() => {
        if (this.onShareCallback) {
          this.onShareCallback(this.extract(turn));
        }
      }, 'QuickShare');

      btn.style.display = 'inline-flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.background = 'transparent';
      btn.style.border = 'none';
      btn.style.cursor = 'pointer';
      btn.style.color = '#8e8ea0';
      btn.style.padding = '4px 6px';
      btn.style.borderRadius = '6px';
      btn.style.transition = 'color 0.2s, background-color 0.2s';

      btn.onmouseenter = () => {
        btn.style.color = '#111827';
        btn.style.backgroundColor = 'rgba(0, 0, 0, 0.08)';
      };
      btn.onmouseleave = () => {
        btn.style.color = '#8e8ea0';
        btn.style.backgroundColor = 'transparent';
      };

      wrapper.appendChild(btn);
      actionsBar.appendChild(wrapper);
    });
  }

  async extract(item?: HTMLElement, selection?: ExcerptSelection): Promise<PostData | null> {
    if (!item) return null;

    try {
      // 1. 递归/跨层级提取上一轮 User Message 的提问容器
      let targetUserMsgEl: Element | null = null;
      let curr: Element | null = item;
      while (curr && !targetUserMsgEl) {
        let prev = curr.previousElementSibling;
        while (prev && !targetUserMsgEl) {
          const userMsgEl =
            prev.querySelector('[data-message-author-role="user"], .whitespace-pre-wrap, div[class*="user-message"]') ||
            (prev.getAttribute('data-message-author-role') === 'user' ? prev : null);
          if (userMsgEl) {
            targetUserMsgEl = userMsgEl;
          }
          prev = prev.previousElementSibling;
        }
        curr = curr.parentElement;
        if (curr === document.body || curr === document.documentElement) break;
      }

      if (!targetUserMsgEl) {
        const allUserMsgs = Array.from(
          document.querySelectorAll('[data-message-author-role="user"], div[class*="user-message"]')
        );
        for (let i = allUserMsgs.length - 1; i >= 0; i--) {
          const u = allUserMsgs[i];
          if (u.compareDocumentPosition(item) & Node.DOCUMENT_POSITION_FOLLOWING) {
            targetUserMsgEl = u;
            break;
          }
        }
      }

      const promptData = await this.cleanChatGPTUserPrompt(targetUserMsgEl);

      // 2. 提取正文内容与富文本 HTML
      const contentRoot = this.getContentRootFromEntity(item);
      if (!contentRoot && !selection) return null;

      let content = '';
      let contentHtml: string | undefined = undefined;
      let excerptBeforeHtml: string | undefined = undefined;
      let excerptAfterHtml: string | undefined = undefined;
      const isExcerpt = Boolean(selection);

      if (selection) {
        content = selection.selectedText.trim();
        contentHtml = sanitizeHtmlForCard(selection.selectedHtml || selection.selectedText.trim());
        excerptBeforeHtml = selection.beforeHtml ? sanitizeHtmlForCard(selection.beforeHtml) : undefined;
        excerptAfterHtml = selection.afterHtml ? sanitizeHtmlForCard(selection.afterHtml) : undefined;
      } else if (contentRoot) {
        contentHtml = this.cleanChatGPTMarkdown(contentRoot);
        content = contentRoot.textContent?.trim() || '';
      }

      const postUrl = cleanShareUrl(window.location.href);

      return {
        id: postUrl,
        platform: 'chatgpt',
        url: postUrl,
        title: promptData.text || undefined,
        promptHtml: promptData.html || undefined,
        author: {
          name: 'ChatGPT',
          handle: '@OpenAI',
          avatarUrl: 'https://chatgpt.com/favicon.ico',
        },
        content,
        contentHtml,
        isExcerpt,
        excerptBeforeHtml,
        excerptAfterHtml,
      };
    } catch (err) {
      console.error('[QuickShare] Failed to extract ChatGPT data:', err);
      return null;
    }
  }

  private async cleanChatGPTUserPrompt(rawEl: Element | null): Promise<{ text: string; html?: string }> {
    if (!rawEl) return { text: '' };

    const rootEl =
      (rawEl.closest('article, [data-message-author-role="user"], div[class*="user-message"]') as HTMLElement) ||
      (rawEl as HTMLElement);

    // 1. 提取所有用户上传图片
    const images: string[] = [];
    rootEl.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
      const src = img.getAttribute('src') || img.src;
      if (src && !src.includes('avatar') && !src.includes('favicon')) {
        if (!images.includes(src)) images.push(src);
      }
    });

    // 2. 提取文本
    const clone = rootEl.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('button, .sr-only, .visually-hidden, [class*="visually-hidden"]').forEach((el) => el.remove());
    const textEl = clone.querySelector('.whitespace-pre-wrap, p, [class*="user-message"]') || clone;
    const text = textEl.textContent?.trim() || '';

    // 3. 组装高质量卡片 HTML
    let html = '';
    if (text) {
      html += `<div class="quick-share-prompt-text font-semibold text-[14.5px] leading-relaxed break-words">${text}</div>`;
    }
    if (images.length > 0) {
      html += '<div class="quick-share-prompt-images flex flex-col gap-2.5 mt-2.5 w-full">';
      const dataUrls = await Promise.all(images.map((src) => fetchImageAsDataUrl(src)));
      dataUrls.forEach((dataUrl) => {
        html += `<img src="${dataUrl}" class="quick-share-prompt-img w-full h-auto object-contain rounded-xl block" alt="Attachment Image" />`;
      });
      html += '</div>';
    }

    return {
      text,
      html: html || undefined,
    };
  }

  private cleanChatGPTMarkdown(rawEl: HTMLElement): string {
    const clone = rawEl.cloneNode(true) as HTMLElement;

    // 清除操作按钮、思考过程、代码执行小部件、网页搜索引用图片流与辅助提示
    const removeSelectors = [
      'button',
      '.quick-share-chatgpt-wrapper',
      'div[data-testid*="action"]',
      'div[data-testid*="thought"]',
      'div[data-testid*="reasoning"]',
      'div[data-testid*="code-execution"]',
      'div[class*="thought"]',
      'div[class*="thinking"]',
      'div[class*="reasoning"]',
      'div[class*="code-execution"]',
      'span[data-content-reference-start]',
      '[data-content-reference-start]',
      '[data-content-reference-end]',
      'div.no-scrollbar',
      'div[class*="search-image"]',
      '[class*="search-image"]',
      'div[data-testid*="citation"]',
      'a[data-testid*="citation"]',
      'details',
      '.sr-only',
      '.visually-hidden',
      '[class*="visually-hidden"]',
      // 代码块顶部按钮
      'div.flex.items-center.relative button',
    ];
    removeSelectors.forEach((sel) => {
      clone.querySelectorAll(sel).forEach((el) => el.remove());
    });

    // 清洗 ChatGPT 自带的 Tailwind 专有类名与硬编码颜色/尺寸，让文字与背景完美契合卡片主题
    clone.querySelectorAll('*').forEach((el) => {
      const isInsideCode = el.closest('pre, code');
      if (!isInsideCode) {
        el.removeAttribute('class');
      } else {
        const cls = el.getAttribute('class');
        if (cls) {
          const cleanedCls = cls
            .split(/\s+/)
            .filter(
              (c) =>
                !c.startsWith('text-token-') &&
                !c.startsWith('bg-token-') &&
                !c.startsWith('dark:') &&
                !c.startsWith('prose') &&
                !c.startsWith('text-gray') &&
                !c.startsWith('bg-gray') &&
                c !== 'text-black' &&
                c !== 'text-white'
            )
            .join(' ');
          if (cleanedCls) {
            el.setAttribute('class', cleanedCls);
          } else {
            el.removeAttribute('class');
          }
        }
      }

      // 移除所有可能强制覆盖主题或导致异常撑高/空白的内联样式
      const tag = el.tagName.toLowerCase();
      if (tag !== 'img' && tag !== 'video') {
        const style = el.getAttribute('style');
        if (style) {
          const cleanedStyle = style
            .replace(/color\s*:[^;]+;?/gi, '')
            .replace(/background(-color)?\s*:[^;]+;?/gi, '')
            .replace(/min-height\s*:[^;]+;?/gi, '')
            .replace(/max-height\s*:[^;]+;?/gi, '')
            .replace(/height\s*:[^;]+;?/gi, '')
            .replace(/flex(-grow)?\s*:[^;]+;?/gi, '')
            .trim();
          if (cleanedStyle) {
            el.setAttribute('style', cleanedStyle);
          } else {
            el.removeAttribute('style');
          }
        }
      }
    });

    // 移除无内容的空占位容器
    clone.querySelectorAll('div, p, span, section').forEach((el) => {
      if (el.children.length === 0 && !el.textContent?.trim()) {
        el.remove();
      }
    });

    // 净化以数字开头的非法 ID，避免 querySelector 报错
    sanitizeDomForScreenshot(clone);

    return sanitizeHtmlForCard(clone.innerHTML);
  }
}
