import { domToBlob, domToPng } from 'modern-screenshot';

export interface ExportOptions {
  scale?: number;
  quality?: number;
}

/**
 * 将远程图片转为 Base64 DataURL，避免 Canvas 导出时被 Tainted
 */
export async function fetchImageAsDataUrl(url: string): Promise<string> {
  if (!url || url.startsWith('data:')) return url;
  try {
    const response = await fetch(url, { credentials: 'omit' });
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('[QuickShare] Failed to convert image to DataURL:', url, error);
    return url;
  }
}

/**
 * 将指定 DOM 节点导出为 PNG DataURL
 */
export async function captureCardAsPng(element: HTMLElement, options: ExportOptions = {}): Promise<string> {
  const { scale = 2, quality = 0.95 } = options;
  return await domToPng(element, {
    scale,
    quality,
    features: {
      removeControlCharacter: true,
    },
  });
}

/**
 * 将指定 DOM 节点导出并复制到系统剪切板
 */
export async function copyCardToClipboard(element: HTMLElement, options: ExportOptions = {}): Promise<boolean> {
  const { scale = 2, quality = 0.95 } = options;
  const blob = await domToBlob(element, {
    scale,
    quality,
    type: 'image/png',
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
