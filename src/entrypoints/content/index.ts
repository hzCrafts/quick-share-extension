import { defineContentScript } from 'wxt/sandbox';
import { createApp } from 'vue';
import App from './App.vue';
import { getAdapterForUrl } from '@/adapters';
import type { PostData } from '@/types/post';
import '@/assets/style.css';

export default defineContentScript({
  matches: [
    '*://*.x.com/*',
    '*://*.twitter.com/*',
    '*://*.zhihu.com/*',
    '*://zhihu.com/*',
    '*://chatgpt.com/*',
    '*://*.chatgpt.com/*',
    '*://chat.openai.com/*',
    '*://*.chat.openai.com/*',
    '*://gemini.google.com/*',
    '*://*.gemini.google.com/*',
  ],
  cssInjectionMode: 'ui',

  async main(ctx) {
    // 检查扩展上下文是否有效
    if (!browser.runtime?.id || !ctx.isValid) return;

    // 获取当前站点适配器
    const adapter = getAdapterForUrl();
    if (!adapter) return;

    let appInstance: any = null;

    let hostEl: HTMLElement | null = null;

    // 创建 Shadow DOM UI 容器，将 Tailwind 样式隔离注入
    const ui = await createShadowRootUi(ctx, {
      name: 'quick-share-ui-container',
      position: 'overlay',
      zIndex: 2147483647,
      anchor: 'body',
      append: 'last',
      onMount: (container) => {
        const root = container.getRootNode() as ShadowRoot;
        hostEl = (root?.host as HTMLElement) || null;
        if (hostEl) {
          hostEl.style.setProperty('position', 'fixed', 'important');
          hostEl.style.setProperty('top', '0', 'important');
          hostEl.style.setProperty('left', '0', 'important');
          hostEl.style.setProperty('width', '100vw', 'important');
          hostEl.style.setProperty('height', '100vh', 'important');
          hostEl.style.setProperty('z-index', '2147483647', 'important');
          hostEl.style.setProperty('pointer-events', 'none', 'important');
        }
        const app = createApp(App);
        appInstance = app.mount(container);
        return app;
      },
      onRemove: (app) => {
        app?.unmount();
      },
    });

    ui.mount();

    if (ui.uiContainer) {
      hostEl = ui.uiContainer;
      hostEl.style.setProperty('position', 'fixed', 'important');
      hostEl.style.setProperty('top', '0', 'important');
      hostEl.style.setProperty('left', '0', 'important');
      hostEl.style.setProperty('width', '100vw', 'important');
      hostEl.style.setProperty('height', '100vh', 'important');
      hostEl.style.setProperty('z-index', '2147483647', 'important');
      hostEl.style.setProperty('pointer-events', 'none', 'important');
    }

    // 启动站点适配器按钮注入监听
    adapter.start((postData) => {
      if (!ctx.isValid) return;
      if (appInstance && appInstance.openShareModal) {
        appInstance.openShareModal(postData);
      }
    });

    // 扩展重载时优雅清理
    ctx.onInvalidated(() => {
      adapter.stop();
    });

    // 统一的划选内容结构化解析与提取
    const processSelection = async (entityEl: HTMLElement, selection: Selection): Promise<PostData | null> => {
      const selectedText = selection.toString().trim();
      if (!selectedText || selection.rangeCount === 0) return null;

      const contentRoot = adapter.getContentRootFromEntity(entityEl) || entityEl;
      const range = selection.getRangeAt(0);

      // 查找选区起点和终点所属的最近块级元素
      const findBlock = (node: Node): HTMLElement => {
        let curr: Node | null = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        while (curr && curr !== contentRoot && curr !== document.body) {
          const tag = (curr as HTMLElement).tagName?.toLowerCase();
          if (['p', 'div', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'section', 'article'].includes(tag)) {
            return curr as HTMLElement;
          }
          curr = curr.parentNode;
        }
        return ((node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement) as HTMLElement) || contentRoot;
      };

      const startBlock = findBlock(range.startContainer);
      const endBlock = findBlock(range.endContainer);

      let isPartialInSingleBlock = false;
      let beforeInBlockHtml = '';
      let afterInBlockHtml = '';

      // 判断是否为单段落内的局部划选（即段落内选区前或选区后有文字）
      if (startBlock === endBlock && startBlock !== contentRoot) {
        try {
          const rangeInStart = document.createRange();
          rangeInStart.setStart(startBlock, 0);
          rangeInStart.setEnd(range.startContainer, range.startOffset);
          const beforeDiv = document.createElement('div');
          beforeDiv.appendChild(rangeInStart.cloneContents());
          const beforeText = beforeDiv.textContent?.trim() || '';

          const rangeInEnd = document.createRange();
          rangeInEnd.setStart(range.endContainer, range.endOffset);
          rangeInEnd.setEnd(startBlock, startBlock.childNodes.length);
          const afterDiv = document.createElement('div');
          afterDiv.appendChild(rangeInEnd.cloneContents());
          const afterText = afterDiv.textContent?.trim() || '';

          if (beforeText || afterText) {
            isPartialInSingleBlock = true;
            if (beforeText) beforeInBlockHtml = beforeDiv.innerHTML;
            if (afterText) afterInBlockHtml = afterDiv.innerHTML;
          }
        } catch (e) {
          console.warn('[QuickShare] Failed to inspect block selection range:', e);
        }
      }

      let beforeHtml: string | undefined = undefined;
      let afterHtml: string | undefined = undefined;
      let selectedHtml = '';

      // 递归修剪所有无实际文本内容与有效媒体的残缺/空容器（彻底消除空 ul/ol/li 产生的多余孤立圆点）
      const pruneEmptyNodes = (container: HTMLElement) => {
        // 1. 移除无关干扰按钮与辅助无障碍空节点
        container.querySelectorAll('button, noscript, .ContentItem-more, .visually-hidden, [aria-hidden="true"]').forEach((el) => {
          if (!el.textContent?.trim() && !el.querySelector('img, svg, math, canvas')) {
            el.remove();
          }
        });

        // 2. 自底向上循环修剪纯空白无媒体的空元素（包括空 li, 空 ul, 空 ol, 空 p, 空 div 等）
        let changed = true;
        let iterations = 0;
        while (changed && iterations < 10) {
          changed = false;
          iterations++;
          const all = Array.from(container.querySelectorAll('*'));
          for (const el of all) {
            const hasMedia = el.querySelector('img, svg, canvas, video, iframe, math');
            const text = el.textContent?.trim();
            if (!text && !hasMedia) {
              el.remove();
              changed = true;
            }
          }
        }
      };

      if (isPartialInSingleBlock) {
        // 场景 A：单段落内部局部划选 -> 段内水平渐显 + 选区高亮 + 段内水平渐隐（无需外部垂直段落）
        try {
          const selDiv = document.createElement('div');
          selDiv.appendChild(range.cloneContents());
          const selInnerHtml = selDiv.innerHTML;

          const tagName = startBlock.tagName.toLowerCase();
          let inner = '';
          if (beforeInBlockHtml) {
            inner += `<span class="quick-share-inline-fade-in">${beforeInBlockHtml}</span>`;
          }
          inner += `<span class="quick-share-spotlight">${selInnerHtml}</span>`;
          if (afterInBlockHtml) {
            inner += `<span class="quick-share-inline-fade-out">${afterInBlockHtml}</span>`;
          }

          selectedHtml = `<${tagName} class="${startBlock.className}">${inner}</${tagName}>`;
        } catch (e) {
          const selDiv = document.createElement('div');
          selDiv.appendChild(range.cloneContents());
          selectedHtml = selDiv.innerHTML;
        }
      } else {
        // 场景 B：选中一整段或跨段落 -> 提取相邻段落作为垂直顶部/底部模糊渐显
        // 1. 提取 startBlock 之前的上文段落
        try {
          if (contentRoot.contains(startBlock) && startBlock !== contentRoot) {
            const rangeBefore = document.createRange();
            rangeBefore.setStart(contentRoot, 0);
            rangeBefore.setEndBefore(startBlock);
            const beforeFrag = rangeBefore.cloneContents();
            const temp = document.createElement('div');
            temp.appendChild(beforeFrag);
            pruneEmptyNodes(temp);

            const children = Array.from(temp.children);
            if (children.length > 0) {
              const sliceChildren = children.slice(-2);
              const container = document.createElement('div');
              sliceChildren.forEach((c) => container.appendChild(c));
              pruneEmptyNodes(container);
              if (container.textContent?.trim()) {
                beforeHtml = container.innerHTML.trim();
              }
            } else if (temp.textContent?.trim()) {
              beforeHtml = temp.innerHTML.trim();
            }
          }
        } catch (e) {
          console.warn('[QuickShare] Failed to extract top before block:', e);
        }

        // 2. 提取 endBlock 之后的下文段落
        try {
          if (contentRoot.contains(endBlock) && endBlock !== contentRoot) {
            const rangeAfter = document.createRange();
            rangeAfter.setStartAfter(endBlock);
            rangeAfter.setEnd(contentRoot, contentRoot.childNodes.length);
            const afterFrag = rangeAfter.cloneContents();
            const temp = document.createElement('div');
            temp.appendChild(afterFrag);
            pruneEmptyNodes(temp);

            const children = Array.from(temp.children);
            if (children.length > 0) {
              const sliceChildren = children.slice(0, 2);
              const container = document.createElement('div');
              sliceChildren.forEach((c) => container.appendChild(c));
              pruneEmptyNodes(container);
              if (container.textContent?.trim()) {
                afterHtml = container.innerHTML.trim();
              }
            } else if (temp.textContent?.trim()) {
              afterHtml = temp.innerHTML.trim();
            }
          }
        } catch (e) {
          console.warn('[QuickShare] Failed to extract bottom after block:', e);
        }

        // 3. 构建整段 / 跨段 selectedHtml（若选区均为 LI 则自愈包裹父级 ul/ol）
        try {
          if (startBlock === endBlock && startBlock !== contentRoot) {
            selectedHtml = startBlock.outerHTML;
          } else {
            const selDiv = document.createElement('div');
            selDiv.appendChild(range.cloneContents());

            const startIsLi = startBlock.tagName.toLowerCase() === 'li';
            const endIsLi = endBlock.tagName.toLowerCase() === 'li';
            const listParent = (startBlock.closest('ul, ol') || endBlock.closest('ul, ol')) as HTMLElement | null;

            if (startIsLi && endIsLi && listParent) {
              const listTag = listParent.tagName.toLowerCase();
              const listClass = listParent.className ? ` class="${listParent.className}"` : '';
              selectedHtml = `<${listTag}${listClass}>${selDiv.innerHTML}</${listTag}>`;
            } else {
              selectedHtml = selDiv.innerHTML;
            }
          }
        } catch (e) {
          const selDiv = document.createElement('div');
          selDiv.appendChild(range.cloneContents());
          selectedHtml = selDiv.innerHTML;
        }
      }

      return await adapter.extract(entityEl, {
        selectedText,
        selectedHtml,
        beforeHtml,
        afterHtml,
      });
    };

    // 划选快捷悬浮按钮监听
    const handleSelectionChange = () => {
      if (!ctx.isValid || !appInstance) return;
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        appInstance.hideFloatingButton?.();
        return;
      }

      const selectedText = selection.toString().trim();
      if (!selectedText) {
        appInstance.hideFloatingButton?.();
        return;
      }

      const targetNode = selection.anchorNode || selection.focusNode;
      if (!targetNode) {
        appInstance.hideFloatingButton?.();
        return;
      }

      const entityEl = adapter.findEntityFromNode(targetNode);
      if (!entityEl) {
        appInstance.hideFloatingButton?.();
        return;
      }

      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
          appInstance.hideFloatingButton?.();
          return;
        }

        const x = rect.left + rect.width / 2;
        const y = rect.top > 45 ? rect.top - 8 : rect.bottom + 36;

        appInstance.showFloatingButton?.(x, y, () => {
          const postPromise = processSelection(entityEl, selection);
          if (appInstance && ctx.isValid) {
            appInstance.openShareModal(postPromise);
          }
        });
      }
    };

    document.addEventListener('mouseup', () => {
      setTimeout(handleSelectionChange, 10);
    });

    document.addEventListener('keyup', () => {
      setTimeout(handleSelectionChange, 10);
    });

    document.addEventListener('mousedown', (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest?.('quick-share-ui-container')) {
        setTimeout(() => {
          const selection = window.getSelection();
          if (!selection || selection.isCollapsed) {
            appInstance?.hideFloatingButton?.();
          }
        }, 10);
      }
    });

    // 监听右键划选分享消息
    try {
      if (browser.runtime?.onMessage) {
        const onMessageListener = (message: unknown) => {
          if (!ctx.isValid) return;
          if (typeof message === 'object' && message !== null && 'type' in message) {
            const msg = message as { type: string; selectionText?: string };
            if (msg.type === 'QUICK_SHARE_SELECTION_TRIGGER') {
              const selection = window.getSelection();
              const targetNode = selection?.anchorNode || selection?.focusNode;
              if (!targetNode) return;

              const entityEl = adapter.findEntityFromNode(targetNode);
              if (!entityEl || !selection) return;

              const postPromise = processSelection(entityEl, selection);
              if (appInstance && ctx.isValid) {
                appInstance.openShareModal(postPromise);
              }
            }
          }
        };

        browser.runtime.onMessage.addListener(onMessageListener);
      }
    } catch (e) {
      // 忽略上下文失效异常
    }
  },
});
