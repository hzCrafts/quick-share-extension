import type { PostData, PlatformType } from '@/types/post';

export type OnShareTrigger = (post: PostData | Promise<PostData | null>) => void;

export interface ExcerptSelection {
  selectedText: string;
  selectedHtml?: string;
  beforeHtml?: string;
  afterHtml?: string;
}

export abstract class BaseAdapter {
  abstract readonly platform: PlatformType;
  abstract readonly name: string;

  /**
   * 判断当前 URL 是否匹配该站点
   */
  abstract match(url: URL): boolean;

  /**
   * 启动 DOM 监听并在目标元素中注入分享按钮
   */
  abstract start(onShare: OnShareTrigger): void;

  /**
   * 停止监听并清理注入的 DOM
   */
  abstract stop(): void;

  /**
   * 检查给定的 DOM 节点是否位于当前站点的 Post Entity 容器内
   * 若在则返回该 Entity 容器的根 HTMLElement，若不在则返回 null
   */
  abstract findEntityFromNode(node: Node): HTMLElement | null;

  /**
   * 获取 Entity 内的正文内容根容器元素（用于 Range 上下文提取）
   */
  abstract getContentRootFromEntity(entity: HTMLElement): HTMLElement | null;

  /**
   * 从目标 DOM 节点或当前页面中提取 Post 结构化数据
   * @param targetElement 目标 Entity DOM 节点
   * @param selection 可选：用户划选的引述文本/HTML 及前后上下文
   */
  abstract extract(targetElement?: HTMLElement, selection?: ExcerptSelection): Promise<PostData | null>;

  /**
   * 生成标准 2A Apple 蔚蓝流晶 SVG 图标 HTML
   */
  protected getQuickShareSvgHtml(size = 18): string {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; flex-shrink: 0;">
        <defs>
          <linearGradient id="qs-btn-front" x1="6" y1="2" x2="22" y2="18" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#0A84FF" />
            <stop offset="100%" stop-color="#0066CC" />
          </linearGradient>
          <linearGradient id="qs-btn-back" x1="2" y1="5" x2="18" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#5AC8FA" />
            <stop offset="100%" stop-color="#0A84FF" />
          </linearGradient>
        </defs>
        <rect x="2.5" y="6.5" width="13.5" height="14" rx="3.5" fill="url(#qs-btn-back)" fill-opacity="0.5" />
        <rect x="6.5" y="3.5" width="15" height="15.5" rx="4" fill="url(#qs-btn-front)" />
        <rect x="7" y="4" width="14" height="14.5" rx="3.5" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="0.8" />
        <path
          d="M10.5 15L17.5 8M17.5 8H12.5M17.5 8V13"
          stroke="#FFFFFF"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    `;
  }

  /**
   * 辅助方法：生成标准按钮的 HTML/DOM 结构（纯 SVG 注入，无冗余 Label）
   */
  protected createShareButton(onClick: (e: MouseEvent) => void, title = 'QuickShare 一键制图分享', size = 18): HTMLElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quick-share-inject-btn';
    btn.title = title;
    btn.setAttribute('aria-label', title);
    btn.setAttribute('data-quick-share', 'true');
    btn.innerHTML = this.getQuickShareSvgHtml(size);
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick(e);
    });
    return btn;
  }
}

