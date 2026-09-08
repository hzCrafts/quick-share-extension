import { domToCanvas } from 'modern-screenshot';

export interface ExportOptions {
  scale?: number;
  quality?: number;
  cardRadius?: number;
}

/**
 * 将远程图片转为 Base64 DataURL，避免 Canvas 导出时被 Tainted 或受 CORS 阻拦
 */
export async function fetchImageAsDataUrl(url: string): Promise<string> {
  if (!url || url.startsWith('data:')) return url;

  // 1. 优先尝试直接在页面内 fetch
  try {
    const response = await fetch(url, { credentials: 'omit' });
    if (response.ok) {
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch {
    // 页面上下文受 CORS 阻拦，继续尝试走 background proxy
  }

  // 2. 若页面内 fetch 失败，通过 background service worker（拥有全部 host_permissions 权限）无跨域限制抓取
  try {
    const res = (await browser.runtime.sendMessage({
      type: 'FETCH_IMAGE_BASE64',
      url,
    })) as { success?: boolean; dataUrl?: string } | undefined;

    if (res?.success && res.dataUrl) {
      return res.dataUrl;
    }
  } catch (error) {
    console.warn('[QuickShare] Background fetch fallback failed for image:', url, error);
  }

  return url;
}

/**
 * 净化待导出的 DOM 树，内联/移除 SVG <use> 引用，修复非标准 ID 以及非法 CSS 选择器，
 * 彻底防止 modern-screenshot 在 querySelector 时抛出 SyntaxError
 */
export function sanitizeDomForScreenshot(root: HTMLElement): void {
  try {
    // 1. 处理所有 <use> 元素：将引用 symbol 的内容直接内联替换，消除 <use> 标签，彻底避免 modern-screenshot 的 querySelector 语法错误
    const useElements = Array.from(root.querySelectorAll('use'));
    useElements.forEach((useEl) => {
      const href = useEl.getAttribute('href') || useEl.getAttribute('xlink:href');
      if (href && href.startsWith('#')) {
        const rawId = href.slice(1);
        // 使用 document.getElementById (支持纯数字 ID 如 "411393"，不会报 CSS 语法错误)
        let targetEl: Element | null = null;
        try {
          targetEl = root.querySelector(`[id="${rawId}"]`) || document.getElementById(rawId);
        } catch {
          targetEl = document.getElementById(rawId);
        }

        if (targetEl) {
          const fragment = document.createDocumentFragment();
          Array.from(targetEl.childNodes).forEach((child) => {
            fragment.appendChild(child.cloneNode(true));
          });
          useEl.parentNode?.replaceChild(fragment, useEl);
        } else {
          useEl.remove();
        }
      } else {
        useEl.remove();
      }
    });

    // 2. 查找所有以数字开头或包含非法 CSS 字符的 ID 并替换为合法 ID
    const idMap = new Map<string, string>();
    const elementsWithId = root.querySelectorAll<HTMLElement>('[id]');
    
    elementsWithId.forEach((el) => {
      const origId = el.getAttribute('id');
      if (!origId) return;
      if (/^[0-9]/.test(origId) || /[^a-zA-Z0-9_\-]/.test(origId)) {
        const safeId = `qs_id_${origId.replace(/[^a-zA-Z0-9_\-]/g, '_')}`;
        idMap.set(origId, safeId);
        el.setAttribute('id', safeId);
      }
    });

    // 3. 如果发生了 ID 替换，更新所有引用该 ID 的属性
    if (idMap.size > 0) {
      const allElements = root.querySelectorAll<HTMLElement>('*');
      allElements.forEach((el) => {
        ['href', 'xlink:href'].forEach((attr) => {
          const val = el.getAttribute(attr);
          if (val && val.startsWith('#')) {
            const rawId = val.slice(1);
            if (idMap.has(rawId)) {
              el.setAttribute(attr, `#${idMap.get(rawId)}`);
            }
          }
        });

        ['clip-path', 'mask', 'fill', 'filter'].forEach((attr) => {
          const val = el.getAttribute(attr);
          if (val && val.includes('url(#')) {
            let updated = val;
            idMap.forEach((safeId, rawId) => {
              updated = updated.split(`url(#${rawId})`).join(`url(#${safeId})`);
              updated = updated.split(`url('#${rawId}')`).join(`url('#${safeId}')`);
              updated = updated.split(`url("#${rawId}")`).join(`url("#${safeId}")`);
            });
            el.setAttribute(attr, updated);
          }
        });

        const style = el.getAttribute('style');
        if (style && style.includes('url(#')) {
          let updated = style;
          idMap.forEach((safeId, rawId) => {
            updated = updated.split(`url(#${rawId})`).join(`url(#${safeId})`);
            updated = updated.split(`url('#${rawId}')`).join(`url('#${safeId}')`);
            updated = updated.split(`url("#${rawId}")`).join(`url("#${safeId}")`);
          });
          el.setAttribute('style', updated);
        }
      });
    }
  } catch (err) {
    console.warn('[QuickShare] sanitizeDomForScreenshot error:', err);
  }
}

/**
 * 净化 HTML 片段中的非标准 SVG/ID 引用与冲突的暗色/行内颜色样式
 */
export function sanitizeHtmlForCard(html: string): string {
  if (!html) return '';
  try {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    sanitizeDomForScreenshot(temp);

    // 清洗可能污染卡片主题的外部暗色/行内颜色属性
    temp.querySelectorAll('*').forEach((el) => {
      const isInsideCode = el.closest('pre, code');
      if (!isInsideCode) {
        // 清理 class 中包含的 dark、prose-invert 等破坏性类
        if (el.className && typeof el.className === 'string') {
          const cleanedClasses = el.className
            .split(/\s+/)
            .filter((c) => !c.startsWith('dark:') && !c.includes('prose-invert') && c !== 'dark')
            .join(' ');
          if (cleanedClasses) {
            el.className = cleanedClasses;
          } else {
            el.removeAttribute('class');
          }
        }

        // 清除行内硬编码的 color 与 background 避免覆盖卡片当前主题
        const style = el.getAttribute('style');
        if (style) {
          (el as HTMLElement).style.removeProperty('color');
          (el as HTMLElement).style.removeProperty('background-color');
          (el as HTMLElement).style.removeProperty('background');
          if (!el.getAttribute('style')) {
            el.removeAttribute('style');
          }
        }
      }
    });

    // 清洗知乎知达/实体词搜索推荐链接，移除图标并还原为正常行内纯文本
    const entityLinks = temp.querySelectorAll<HTMLAnchorElement>(
      'a.RichContent-EntityWord, a[href*="zhida.zhihu.com"], a[class*="EntityWord"], a[data-za-not-track-link="true"]'
    );
    entityLinks.forEach((a) => {
      a.querySelectorAll('svg, .ZDI, [class*="FourPointedStar"]').forEach((icon) => icon.remove());
      const text = a.textContent?.trim() || '';
      a.replaceWith(document.createTextNode(text));
    });

    return temp.innerHTML;
  } catch {
    return html;
  }
}

/**
 * 获取真正的卡片主体节点（优先获取具备外层背景与边距的 .qs-card-wrapper，或内层 .qs-card）
 */
function getCardTargetElement(element: HTMLElement): HTMLElement {
  if (element.classList?.contains('qs-card-wrapper')) {
    return element;
  }
  const wrapper = element.querySelector<HTMLElement>('.qs-card-wrapper');
  if (wrapper) {
    return wrapper;
  }
  if (element.classList?.contains('qs-card')) {
    return element;
  }
  return element.querySelector<HTMLElement>('.qs-card') || element;
}

/**
 * 为 Canvas 应用圆角裁剪，消除 foreignObject 渲染造成的四角白底
 */
export function applyCanvasBorderRadius(canvas: HTMLCanvasElement, radius: number): HTMLCanvasElement {
  if (radius <= 0) return canvas;
  const clippedCanvas = document.createElement('canvas');
  clippedCanvas.width = canvas.width;
  clippedCanvas.height = canvas.height;
  const ctx = clippedCanvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(0, 0, canvas.width, canvas.height, radius);
  } else {
    const w = canvas.width;
    const h = canvas.height;
    const r = Math.min(radius, w / 2, h / 2);
    ctx.moveTo(r, 0);
    ctx.lineTo(w - r, 0);
    ctx.arcTo(w, 0, w, r, r);
    ctx.lineTo(w, h - r);
    ctx.arcTo(w, h, w - r, h, r);
    ctx.lineTo(r, h);
    ctx.arcTo(0, h, 0, h - r, r);
    ctx.lineTo(0, r);
    ctx.arcTo(0, 0, r, 0, r);
    ctx.closePath();
  }
  ctx.clip();
  ctx.drawImage(canvas, 0, 0);
  return clippedCanvas;
}

/**
 * 将指定 DOM 节点渲染为裁剪了透明圆角的 Canvas
 */
export async function renderCardToCanvas(element: HTMLElement, options: ExportOptions = {}): Promise<HTMLCanvasElement> {
  const { scale = 2.5, cardRadius = 16 } = options;
  const target = getCardTargetElement(element);
  sanitizeDomForScreenshot(target);

  // 判断是否开启了外层背景边距 (外层 100% 直角输出)
  const isOuterPadding = target.classList?.contains('has-outer-padding');

  let radius = 0;
  if (!isOuterPadding) {
    radius = cardRadius;
    try {
      const cardEl = target.classList?.contains('qs-card') ? target : target.querySelector('.qs-card');
      const computedRadius = cardEl ? window.getComputedStyle(cardEl).borderRadius : window.getComputedStyle(target).borderRadius;
      if (computedRadius) {
        const parsed = parseFloat(computedRadius);
        if (!isNaN(parsed) && parsed > 0) {
          radius = parsed;
        }
      }
    } catch {}
  }

  const rawCanvas = await domToCanvas(target, {
    scale,
    font: false,
    backgroundColor: null,
    features: {
      removeControlCharacter: true,
    },
  });

  return isOuterPadding ? rawCanvas : applyCanvasBorderRadius(rawCanvas, radius * scale);
}

/**
 * 将指定 DOM 节点导出为 PNG DataURL
 */
export async function captureCardAsPng(element: HTMLElement, options: ExportOptions = {}): Promise<string> {
  const { quality = 0.98 } = options;
  const canvas = await renderCardToCanvas(element, options);
  return canvas.toDataURL('image/png', quality);
}

/**
 * 将指定 DOM 节点导出并复制到系统剪切板
 */
export async function copyCardToClipboard(element: HTMLElement, options: ExportOptions = {}): Promise<boolean> {
  const { quality = 0.98 } = options;
  const canvas = await renderCardToCanvas(element, options);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/png', quality);
  });

  if (!blob) {
    throw new Error('渲染图片 Blob 失败');
  }

  if (!navigator.clipboard || !navigator.clipboard.write) {
    throw new Error('当前浏览器上下文不支持剪切板写入 API');
  }

  await navigator.clipboard.write([
    new ClipboardItem({
      'image/png': blob,
    }),
  ]);

  return true;
}

/**
 * 将指定 DOM 节点导出并下载为文件
 */
export async function downloadCardAsPng(element: HTMLElement, filename = 'post-card.png', options: ExportOptions = {}): Promise<void> {
  const dataUrl = await captureCardAsPng(element, options);
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
