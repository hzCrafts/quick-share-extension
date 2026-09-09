import { BaseAdapter, type OnShareTrigger, type ExcerptSelection } from './base';
import type { PostData } from '@/types/post';
import { cleanShareUrl, getHighResGoogleImageUrl } from '@/utils/url';
import { sanitizeHtmlForCard, fetchImageAsDataUrl, sanitizeDomForScreenshot } from '@/utils/exporter';

export class GeminiAdapter extends BaseAdapter {
  readonly platform = 'gemini';
  readonly name = 'Gemini';
  private observer: MutationObserver | null = null;
  private onShareCallback: OnShareTrigger | null = null;

  match(url: URL): boolean {
    return url.hostname.includes('gemini.google.com');
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
    document.querySelectorAll('.quick-share-gemini-wrapper').forEach((el) => el.remove());
  }

  /**
   * 检查选区节点是否处于 Gemini Model 回答容器内
   */
  findEntityFromNode(node: Node): HTMLElement | null {
    const el = (node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement) as HTMLElement | null;
    if (!el) return null;

    // 排除侧边导航栏、底部输入区
    if (el.closest('chat-window-side-nav, .input-area, .chat-input-container, form, mat-sidenav')) {
      return null;
    }

    const turn = el.closest<HTMLElement>(
      'model-response, response-container, div.conversation-container, div[class*="model-response"], message-content'
    );
    if (!turn) return null;

    // 排除用户自身提问容器
    if (el.closest('user-query, .user-query-container, .query-text')) {
      return null;
    }

    return turn;
  }

  /**
   * 获取 Gemini Entity 内的正文根容器（即 Markdown/MessageContent 渲染区）
   */
  getContentRootFromEntity(entity: HTMLElement): HTMLElement | null {
    return (
      entity.querySelector<HTMLElement>('message-content, .model-response-text, .markdown, .response-content') ||
      entity.querySelector<HTMLElement>('div[class*="response-content"]') ||
      entity
    );
  }

  private scanAndInject(): void {
    const responses = document.querySelectorAll<HTMLElement>(
      'model-response, response-container, div.conversation-container'
    );

    responses.forEach((resEl) => {
      // 寻找底部操作栏 (.buttons-container-v2, response-action-bar, etc.)
      const actionsBar =
        resEl.querySelector<HTMLElement>('.buttons-container-v2') ||
        resEl.querySelector<HTMLElement>('response-action-bar .buttons-container-v2') ||
        resEl.querySelector<HTMLElement>('response-action-bar, .action-bar, .response-footer, div[class*="action-bar"]') ||
        resEl.querySelector<HTMLElement>('message-content + *');

      if (!actionsBar || actionsBar.querySelector('.quick-share-gemini-btn, .quick-share-gemini-wrapper')) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quick-share-gemini-btn mdc-icon-button mat-mdc-icon-button mat-mdc-button-base';
      btn.setAttribute('aria-label', 'QuickShare 卡片分享');
      btn.setAttribute('title', 'QuickShare 卡片分享');
      btn.style.display = 'inline-flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.background = 'transparent';
      btn.style.border = 'none';
      btn.style.cursor = 'pointer';
      btn.style.color = '#70757a';
      btn.style.width = '32px';
      btn.style.height = '32px';
      btn.style.borderRadius = '50%';
      btn.style.padding = '0';
      btn.style.margin = '0 2px';
      btn.style.transition = 'color 0.2s, background-color 0.2s';

      btn.innerHTML = this.getQuickShareSvgHtml(22);

      btn.onmouseenter = () => {
        btn.style.color = '#1a73e8';
        btn.style.backgroundColor = 'rgba(26, 115, 232, 0.1)';
      };
      btn.onmouseleave = () => {
        btn.style.color = '#70757a';
        btn.style.backgroundColor = 'transparent';
      };

      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.onShareCallback) {
          this.onShareCallback(this.extract(resEl));
        }
      };

      // 优先插入到 .spacer 前或 .more-menu-button-container 旁边
      const spacer = actionsBar.querySelector('.spacer');
      if (spacer) {
        actionsBar.insertBefore(btn, spacer);
      } else {
        actionsBar.appendChild(btn);
      }
    });
  }

  async extract(item?: HTMLElement, selection?: ExcerptSelection): Promise<PostData | null> {
    if (!item) return null;

    try {
      // 1. 提取当前 turn 对应的 User Query 提问及附件（图片、文件卡片）
      let targetUserQueryEl: Element | null = null;
      const querySelectors =
        'user-query-content, user-query, .user-query-container, [data-test-id="user-query"], .query-content, .query-text, div[class*="user-query"]';

      // (1) 优先检查当前容器或所属会话块内部是否含有 user-query
      const turnContainer =
        item.closest('conversation-container, .conversation-container, div[class*="conversation"], infinite-scroller > *') ||
        item;
      const insideQuery = turnContainer.querySelector(querySelectors);
      if (insideQuery) {
        targetUserQueryEl = insideQuery;
      }

      // (2) 向上遍历前置兄弟节点
      if (!targetUserQueryEl) {
        let curr: Element | null = item;
        while (curr && !targetUserQueryEl) {
          let prev = curr.previousElementSibling;
          while (prev && !targetUserQueryEl) {
            const userQueryEl = prev.querySelector(querySelectors) || (prev.matches?.(querySelectors) ? prev : null);
            if (userQueryEl) {
              targetUserQueryEl = userQueryEl;
            }
            prev = prev.previousElementSibling;
          }
          curr = curr.parentElement;
          if (curr === document.body || curr === document.documentElement) break;
        }
      }

      // (3) 全局 DOM 顺序搜索当前节点之前的最后一个 user-query
      if (!targetUserQueryEl) {
        const allUserQueries = Array.from(document.querySelectorAll(querySelectors));
        for (let i = allUserQueries.length - 1; i >= 0; i--) {
          const u = allUserQueries[i];
          const pos = u.compareDocumentPosition(item);
          if (pos & Node.DOCUMENT_POSITION_FOLLOWING || pos & Node.DOCUMENT_POSITION_CONTAINED_BY) {
            targetUserQueryEl = u;
            break;
          }
        }
      }

      const promptData = await this.cleanGeminiUserPrompt(targetUserQueryEl);

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
        contentHtml = this.cleanGeminiMarkdown(contentRoot);
        content = contentRoot.textContent?.trim() || '';
      }

      const postUrl = cleanShareUrl(window.location.href);

      return {
        id: postUrl,
        platform: 'gemini',
        url: postUrl,
        title: promptData.text || undefined,
        promptHtml: promptData.html || undefined,
        author: {
          name: 'Gemini',
          handle: '@GoogleAI',
          avatarUrl: 'https://www.gstatic.com/lamda/images/gemini_sparkle_4g_512_lt_f94943af3be039176192d.png',
        },
        content,
        contentHtml,
        isExcerpt,
        excerptBeforeHtml,
        excerptAfterHtml,
      };
    } catch (err) {
      console.error('[QuickShare] Failed to extract Gemini data:', err);
      return null;
    }
  }

  private async cleanGeminiUserPrompt(rawEl: Element | null): Promise<{ text: string; html?: string }> {
    if (!rawEl) return { text: '' };

    // 获取包含附件/图片的完整 user-query 容器
    const rootEl =
      (rawEl.closest('user-query-content, user-query, .user-query-container, div[class*="user-query"]') as HTMLElement) ||
      (rawEl as HTMLElement);

    // 1. 提取所有用户上传图片 (Gemini 使用 img[data-test-id="uploaded-img"] 或 img.preview-image)
    const images: string[] = [];
    const imgEls = rootEl.querySelectorAll<HTMLImageElement>(
      'img[data-test-id="uploaded-img"], img.preview-image, user-query-file-preview img, .file-preview-container img, img'
    );
    imgEls.forEach((img) => {
      const src = img.getAttribute('src') || img.src;
      if (src && !src.includes('favicon') && !src.includes('avatar') && !src.includes('sparkle') && !src.includes('google_logo')) {
        if (!images.includes(src)) {
          images.push(src);
        }
      }
    });

    // 2. 提取非图片的文档附件 (如 PDF、代码文件等)
    interface FileAttachment {
      name: string;
      info?: string;
    }
    const files: FileAttachment[] = [];
    const filePreviews = rootEl.querySelectorAll<HTMLElement>(
      'user-query-file-preview, .query-file-preview'
    );
    filePreviews.forEach((preview) => {
      // 若该附件已经包含图片，则跳过（图片已被提取至 images 列表中）
      if (preview.querySelector('img[data-test-id="uploaded-img"], img.preview-image')) {
        return;
      }
      const nameEl = preview.querySelector('.file-name, .file-title, [class*="name"], [class*="title"], h6, p');
      const fileName = nameEl?.textContent?.trim();
      if (fileName && !files.some((f) => f.name === fileName)) {
        const infoEl = preview.querySelector('.file-size, .file-details, [class*="size"], [class*="type"], span');
        const fileInfo = infoEl?.textContent?.trim() || '';
        files.push({ name: fileName, info: fileInfo });
      }
    });

    // 3. 提取文本内容
    let text = '';
    const queryTextEl = rootEl.querySelector('.query-text, .query-content, [class*="query-text"]');
    if (queryTextEl) {
      const cloneText = queryTextEl.cloneNode(true) as HTMLElement;
      cloneText.querySelectorAll('.cdk-visually-hidden, .visually-hidden, .screen-reader-user-query-label, button').forEach((el) => el.remove());
      text = cloneText.querySelector('.query-text-line, p')?.textContent?.trim() || cloneText.textContent?.trim() || '';
    }
    if (!text) {
      const cloneFallback = rootEl.cloneNode(true) as HTMLElement;
      cloneFallback.querySelectorAll('button, user-query-file-carousel, .file-preview-container, .cdk-visually-hidden, .visually-hidden, .screen-reader-user-query-label').forEach((el) => el.remove());
      text = cloneFallback.textContent?.trim() || '';
    }
    // 净化无意义前缀
    text = text.replace(/^你说\s*/, '').trim();

    // 4. 组装高质量卡片 HTML
    let html = '';
    if (text) {
      html += `<div class="quick-share-prompt-text font-semibold text-[14.5px] leading-relaxed break-words">${text}</div>`;
    }

    if (images.length > 0) {
      html += '<div class="quick-share-prompt-images flex flex-col gap-2.5 mt-2.5 w-full">';
      const dataUrls = await Promise.all(
        images.map((src) => {
          const highResUrl = getHighResGoogleImageUrl(src);
          return fetchImageAsDataUrl(highResUrl);
        })
      );
      dataUrls.forEach((dataUrl) => {
        html += `<img src="${dataUrl}" class="quick-share-prompt-img w-full h-auto object-contain rounded-xl block" alt="Attachment Image" />`;
      });
      html += '</div>';
    }

    if (files.length > 0) {
      html += '<div class="quick-share-prompt-files flex flex-col gap-2 mt-2.5 w-full">';
      files.forEach((f) => {
        html += `
          <div class="quick-share-prompt-file-chip flex items-center gap-2.5 p-2.5 rounded-xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/15 text-xs">
            <svg class="w-5 h-5 opacity-70 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <div class="min-w-0 flex-1">
              <div class="font-semibold truncate">${f.name}</div>
              ${f.info ? `<div class="opacity-60 text-[11px] truncate mt-0.5">${f.info}</div>` : ''}
            </div>
          </div>
        `;
      });
      html += '</div>';
    }

    return {
      text,
      html: html || undefined,
    };
  }

  private cleanGeminiMarkdown(rawEl: HTMLElement): string {
    const clone = rawEl.cloneNode(true) as HTMLElement;

    // 清除操作按钮、TTS播放按钮、模型头部提示、视障辅助隐藏文本与多余控件
    const removeSelectors = [
      'button',
      '.quick-share-gemini-wrapper',
      'response-action-bar',
      '.action-bar',
      '.tts-button',
      'mat-icon',
      '.model-response-header',
      '[class*="model-response-header"]',
      '[class*="response-header"]',
      '.header',
      '.avatar',
      '.source-footer',
      '.citation-container',
      '.cdk-visually-hidden',
      '.visually-hidden',
      '.sr-only',
      '[class*="visually-hidden"]',
      '[class*="screen-reader"]',
      'user-query',
      '.user-query-container',
      '.query-text',
      'h2.cdk-visually-hidden',
      '.copy-button',
      '[class*="copy-button"]',
      '.code-block-decoration button',
      '[data-test-id*="copy"]',
    ];
    removeSelectors.forEach((sel) => {
      clone.querySelectorAll(sel).forEach((el) => el.remove());
    });

    // 针对任何包含 "Gemini 说" / "Gemini" 独立标题标签进行精准清理
    const headingsAndDivs = clone.querySelectorAll('h1, h2, h3, h4, div, span, p');
    headingsAndDivs.forEach((el) => {
      const text = el.textContent?.trim();
      if (text && /^Gemini\s*(说|says|said)?$/i.test(text)) {
        el.remove();
      }
    });

    // 净化以数字开头的非法 ID，内联/移除 <use> 避免 querySelector 报错
    sanitizeDomForScreenshot(clone);

    return sanitizeHtmlForCard(clone.innerHTML);
  }
}
