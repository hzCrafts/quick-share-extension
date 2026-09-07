import { BaseAdapter, type OnShareTrigger } from './base';
import type { PostData } from '@/types/post';

export class UniversalAdapter extends BaseAdapter {
  readonly platform = 'universal';
  readonly name = '通用网页 (Universal)';
  private onShareCallback: OnShareTrigger | null = null;

  match(_url: URL): boolean {
    return true; // 作为兜底适配器
  }

  start(onShare: OnShareTrigger): void {
    this.onShareCallback = onShare;
  }

  stop(): void {
    this.onShareCallback = null;
  }

  async extract(_targetElement?: HTMLElement): Promise<PostData | null> {
    const selectedText = window.getSelection()?.toString()?.trim();
    const pageTitle = document.title;
    const pageUrl = window.location.href;
    const faviconEl = document.querySelector<HTMLLinkElement>('link[rel*="icon"]');
    const faviconUrl = faviconEl?.href || `${window.location.origin}/favicon.ico`;

    const metaDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content;
    const content = selectedText || metaDescription || '暂无选中文本摘要';

    return {
      id: pageUrl,
      platform: 'universal',
      url: pageUrl,
      title: pageTitle,
      author: {
        name: new URL(pageUrl).hostname,
        handle: '网页快照',
        avatarUrl: faviconUrl,
      },
      content,
      createdAt: new Date().toLocaleDateString('zh-CN'),
    };
  }

  triggerUniversalShare(): void {
    this.extract().then((post) => {
      if (post && this.onShareCallback) {
        this.onShareCallback(post);
      }
    });
  }
}
