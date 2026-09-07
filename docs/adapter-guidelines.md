# QuickShare 站点适配器与金句分享规范 (Single Source of Truth)

本文档是 QuickShare 扩展接入新站点以及维护现有适配器的 **唯一事实基准 (Single Source of Truth, SSOT)**。所有站点适配器（如知乎、X/Twitter、即刻、小红书等）必须严格遵循本规范中定义的接口契约、排版原则与设计哲学。

---

## 核心原则 (Core Tenets)

### 1. 原站点 Output 格式绝对保真 (Strict Layout Fidelity)
* **不可篡改原始排版**：必须严格遵循要分享 Entity 在原站点的 Output 格式。
* **样式可美化，结构不可变**：允许在 CSS / UI 层面做视觉润色（如添加轻微圆角、主题配色、字体阴影、毛玻璃等），但**严禁篡改原有 Layout 结构**：
  * 段落换行（`<p>`, `<br>`）严格保留；
  * 图片在文本中的先后排列位置不可随意置顶或置底（若原文为图文混排，需保持图文混排流）；
  * 列表（`<ul>`, `<ol>`）、引用块（`<blockquote>`）、代码块（`<pre><code>`）结构完整保留。
* **外链与媒体流**：
  * 如推文或帖子附带外链 Card，应在正文末尾附上规范 URL，并在其下方呈现卡片预览大图；
  * 原帖附带的视频应转换为视频来源链接附在正文中。

### 2. 金句 / 划词分享 UI 全局一致 (Universal Excerpt & Spotlight UI)
* **逻辑统一，仅差异化识别**：金句分享的 UI 表现与交互逻辑在所有站点之间**必须完全一致**。
* **适配器职责单一化**：适配器仅负责：
  1. 识别并定位当前站点的 Post Entity 边界；
  2. 获取 Entity 的正文容器节点（Content Root）；
  3. 提取作者、标准 Clean URL、站点 Favicon 与正文数据。
* **全局划词交互由系统管线统一驱动**：
  * **单段落内局部划选**：段落内选区前文字水平渐显（Fade-in）+ 微模糊，选区核心文字 100% 锐利高亮，选区后文字水平渐隐（Fade-out）+ 微模糊，省略外部无关段落；
  * **完整整段 / 跨段落划选**：选中的段落 100% 锐利呈现，上方相邻段落呈现垂直顶部淡出（底部对齐无截断），下方相邻段落呈现垂直底部淡出；
  * **划词悬浮快捷唤起**：选区上方/下方统一弹出快捷 `QuickShare` Pill 按钮。

### 3. URL 规范清洗 (Clean Canonical URL)
* 必须剔除一切营销追踪参数（如 `utm_*`, `ref`, `share_source`, `origin` 等）；
* 必须精确定位到具体的回答/帖子/文章级别（例如知乎问答必须是 `/question/{qid}/answer/{aid}`，而非仅 `/question/{qid}`）。

---

## 接口契约规范 (Global Interface Contract)

所有站点适配器必须继承并实现 `BaseAdapter`（位于 `src/adapters/base.ts`）：

```typescript
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
   * 1. 路由匹配：判断当前 URL 是否归属该适配器
   */
  abstract match(url: URL): boolean;

  /**
   * 2. 按钮注入：启动 DOM MutationObserver 并向 Entity 操作栏注入 QuickShare 按钮
   */
  abstract start(onShare: OnShareTrigger): void;

  /**
   * 3. 清理：停止监听并清理注入的 DOM 节点
   */
  abstract stop(): void;

  /**
   * 4. 选区归属校验：检查 DOM 节点是否位于合法的 Post Entity 容器内（严格隔离侧边栏、评论区与导航栏）
   */
  abstract findEntityFromNode(node: Node): HTMLElement | null;

  /**
   * 5. 定位正文根节点：获取 Entity 内部承载文字与图文排版的根容器（用于 Range 上下文提取）
   */
  abstract getContentRootFromEntity(entity: HTMLElement): HTMLElement | null;

  /**
   * 6. 结构化数据提取：提取 PostData（支持全文提取与 Excerpt 引述模式）
   */
  abstract extract(targetElement?: HTMLElement, selection?: ExcerptSelection): Promise<PostData | null>;
}
```

---

## 新增站点适配器检查清单 (Checklist for New Adapters)

在新增任何站点（如小红书、即刻、微博、Medium 等）时，必须按顺序完成以下自检：

- [ ] **1. Favicon 规范**：在 `ShareCard.vue` 的 `platformConfig` 中配置官方高清 Favicon（如 `https://example.com/favicon.ico`）与品牌 Badge 颜色。
- [ ] **2. 展开全文保障**：提取前调用 `ensureExpanded(entity)` 自动展开被折叠的“查看更多/展开全部”。
- [ ] **3. Entity 边界隔离**：`findEntityFromNode` 必须严格排除评论区、侧边栏、广告流与页头页尾。
- [ ] **4. 原图质量优先**：清洗图片 URL 时获取最高清原图源（如替换缩略图参数为原图，知乎 `data-original`，X `name=large`）。
- [ ] **5. Clean URL**：使用 `cleanShareUrl` 工具清洗所有追踪 query。
- [ ] **6. 注册适配器**：在 `src/adapters/index.ts` 中注册新适配器。
