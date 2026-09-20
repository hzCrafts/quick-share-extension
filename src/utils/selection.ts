import type { BaseAdapter } from '@/adapters/base';
import type { PostData } from '@/types/post';
import { EXCLUDED_SELECTION } from '@/adapters/universal.adapter';

/** Resolve both ends, including reverse and cross-paragraph selections. */
export function getSelectionEntity(adapter: BaseAdapter, range: Range): HTMLElement | null {
  if (range.collapsed || !range.toString().trim()) return null;
  const entity = adapter.findEntityFromNode(range.commonAncestorContainer)
    || adapter.findEntityFromNode(range.startContainer);
  if (!entity) return null;
  const root = adapter.getContentRootFromEntity(entity) || entity;
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
  for (const node of [range.startContainer, range.endContainer]) {
    const el = node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement;
    if (el?.closest(EXCLUDED_SELECTION)) return null;
  }
  const excluded = adapter.platform === 'universal' ? EXCLUDED_SELECTION : 'input, textarea, [contenteditable]:not([contenteditable="false"])';
  for (const el of root.querySelectorAll(excluded)) {
    if (range.intersectsNode(el)) return null;
  }
  return entity;
}

/** Shared range splitting; adapters only interpret source metadata/content. */
export async function extractSelection(adapter: BaseAdapter, range: Range): Promise<PostData | null> {
  const entityEl = getSelectionEntity(adapter, range);
  if (!entityEl) return null;
  const selectedText = range.toString().trim();
  const contentRoot = adapter.getContentRootFromEntity(entityEl) || entityEl;
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
    return contentRoot;
  };

  const startBlock = findBlock(range.startContainer);
  const endBlock = findBlock(range.endContainer);
  const selectedFragment = () => {
    const container = document.createElement('div');
    let fragment: Node = range.cloneContents();
    // cloneContents omits a shared inline ancestor, e.g. selecting text inside <strong>.
    let ancestor = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer.parentElement : range.commonAncestorContainer as HTMLElement;
    while (ancestor && ancestor !== startBlock && startBlock.contains(ancestor)) {
      const wrapper = ancestor.cloneNode(false);
      wrapper.appendChild(fragment);
      fragment = wrapper;
      ancestor = ancestor.parentElement;
    }
    container.appendChild(fragment);
    return container;
  };

  let isPartialInSingleBlock = false;
  let beforeInBlockHtml = '';
  let afterInBlockHtml = '';

  // 判断是否为单段落内的局部划选（即段落内选区前或选区后有文字）
  if (startBlock === endBlock && (startBlock !== contentRoot || range.commonAncestorContainer.nodeType === Node.TEXT_NODE)) {
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
        if (!text && !hasMedia && !el.matches('br, img, svg, canvas, video, iframe, math')) {
          el.remove();
          changed = true;
        }
      }
    }
  };

  if (isPartialInSingleBlock) {
    // 场景 A：单段落内部局部划选 -> 段内水平渐显 + 选区高亮 + 段内水平渐隐（无需外部垂直段落）
    try {
      const selDiv = selectedFragment();
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

      const wrapper = document.createElement(tagName);
      wrapper.className = startBlock.className;
      wrapper.innerHTML = inner;
      selectedHtml = wrapper.outerHTML;
    } catch (e) {
      const selDiv = selectedFragment();
      selectedHtml = selDiv.innerHTML;
    }
  } else {
    // 场景 B：选中一整段或跨段落 -> 提取相邻段落作为垂直顶部/底部模糊渐显
    // 1. 提取 startBlock 之前的上文段落
    try {
      if (contentRoot.contains(range.startContainer)) {
        const rangeBefore = document.createRange();
        rangeBefore.setStart(contentRoot, 0);
        rangeBefore.setEnd(range.startContainer, range.startOffset);
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
      if (contentRoot.contains(range.endContainer)) {
        const rangeAfter = document.createRange();
        rangeAfter.setStart(range.endContainer, range.endOffset);
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
        const wrapper = startBlock.cloneNode(false) as HTMLElement;
        wrapper.append(...Array.from(selectedFragment().childNodes));
        selectedHtml = wrapper.outerHTML;
      } else {
        const selDiv = selectedFragment();

        const startIsLi = startBlock.tagName.toLowerCase() === 'li';
        const endIsLi = endBlock.tagName.toLowerCase() === 'li';
        const listParent = (startBlock.closest('ul, ol') || endBlock.closest('ul, ol')) as HTMLElement | null;

        if (startIsLi && endIsLi && listParent) {
          const listTag = listParent.tagName.toLowerCase();
          const list = document.createElement(listTag);
          list.className = listParent.className;
          list.append(...Array.from(selDiv.childNodes));
          selectedHtml = list.outerHTML;
        } else {
          selectedHtml = selDiv.innerHTML;
        }
      }
    } catch (e) {
      const selDiv = selectedFragment();
      selectedHtml = selDiv.innerHTML;
    }
  }

  return await adapter.extract(entityEl, {
    selectedText,
    selectedHtml,
    beforeHtml,
    afterHtml,
  });
}
