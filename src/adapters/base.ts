import type { PostData, PlatformType } from '@/types/post';

export type OnShareTrigger = (post: PostData) => void;

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
   * 辅助方法：生成标准按钮的 HTML/DOM 结构
   */
  protected createShareButton(onClick: (e: MouseEvent) => void, title = 'QuickShare'): HTMLElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quick-share-inject-btn';
    btn.title = title;
    btn.setAttribute('data-quick-share', 'true');
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
        <circle cx="9" cy="9" r="2"/>
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
      </svg>
    `;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick(e);
    });
    return btn;
  }
}
