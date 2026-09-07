# QuickShare Developer & Agent Guidelines

欢迎来到 **QuickShare** 项目代码库。本文档旨在为 AI Agent 及开发者提供全景架构认知、开发规范与行为准则。

---

## 📖 项目定位与概况 (Project Overview)

**QuickShare** 是一款基于 Chrome Extension Manifest V3 打造的现代社交媒体卡片化分享工具。
核心功能包括：
1. **一键全文卡片化**：在支持的社交媒体（知乎、X/Twitter 等）内容操作栏自动注入 QuickShare 按钮，将回答、专栏、推文转化为高清晰度社交分享图；
2. **划词悬浮快捷分享 / 金句引述**：在支持的 Entity 内部划选文字时，自动浮现快捷按钮，支持段落内水平渐隐渐显与整段垂直渐隐，呈现类似微信读书风格的精美书摘卡片；
3. **多主题与高保真导出**：内置 7 种预设主题，支持独立 640px 离屏 Retina 高分辨率渲染导出（复制图片 / 下载 PNG）。

---

## 🛠️ 技术栈与依赖架构 (Tech Stack)

* **扩展框架**：[WXT (Next-Gen Web Extension Framework)](https://wxt.dev/) (Chrome MV3)
* **UI 框架**：Vue 3 (`<script setup>`, Composition API)
* **类型系统**：TypeScript (严格类型安全)
* **样式系统**：Tailwind CSS (通过 Shadow DOM 进行 100% 隔离注入)
* **图片生成引擎**：`modern-screenshot` (解耦离屏 2.5x Retina 渲染)
* **构建与包管理**：Vite 6 + pnpm

---

## 📁 目录结构地图 (Directory Map)

```
quick-share-extension/
├── AGENTS.md                  # 本文档：Agent 与开发者全景指南
├── README.md                  # 项目对外说明与快速上手
├── docs/
│   └── adapter-guidelines.md  # 站点适配器与金句分享规范 (SSOT 事实基准)
├── src/
│   ├── adapters/              # 站点适配器层 (Adapter Layer)
│   │   ├── base.ts            # BaseAdapter 抽象基类与 ExcerptSelection 接口
│   │   ├── x.adapter.ts       # X (Twitter) 适配器
│   │   ├── zhihu.adapter.ts   # 知乎（问答 / 专栏）适配器
│   │   ├── chatgpt.adapter.ts # ChatGPT 对话单轮卡片化适配器
│   │   ├── gemini.adapter.ts  # Google Gemini 对话单轮卡片化适配器
│   │   └── index.ts           # 适配器注册表与匹配路由器
│   ├── assets/
│   │   └── style.css          # 全局样式与 Tailwind 指令
│   ├── components/
│   │   ├── card/
│   │   │   └── ShareCard.vue  # 卡片视觉主体（主题、富文本、双向渐隐渲染）
│   │   └── modal/
│   │       └── ShareModal.vue # 交互弹窗、实时缩放平移视口、离屏导出控制
│   ├── entrypoints/
│   │   ├── background.ts      # MV3 Background Service Worker (右键菜单监听)
│   │   ├── content/           # Content Script (Shadow DOM 挂载、选区监听、划词悬浮按钮)
│   │   │   ├── App.vue        # Shadow DOM 顶层 Vue 容器
│   │   │   └── index.ts       # Content 入口与选区解析管线
│   │   └── popup/             # 扩展工具栏 Popup
│   ├── types/
│   │   ├── post.ts            # PostData 结构化接口定义
│   │   └── theme.ts           # 卡片主题与渲染选项
│   └── utils/
│       ├── exporter.ts        # modern-screenshot 离屏高清导出与剪贴板工具
│       └── url.ts             # 规范 URL 营销参数清洗器 (cleanShareUrl)
```

---

## 🎯 核心开发守则与 SSOT (Core Guidelines)

所有参与本项目的 Agent 和开发者必须严格遵守以下准则：

### 1. 站点输出格式绝对保真 (Strict Output Fidelity)
- **准则**：详见 [`docs/adapter-guidelines.md`](file:///Users/ryancui/projects/quick-share-extension/docs/adapter-guidelines.md)。
- **要求**：必须严格遵循要分享 Entity 在原站点的 Output 格式。可进行 CSS 美化，但**绝对禁止打乱原有的 DOM 排版顺序、段落换行和图片穿插位置**。

### 2. 金句 / 划词分享 UI 全局一致 (Universal Excerpt UI)
- **准则**：所有站点共享同一套金句渲染与划词悬浮交互逻辑。
- **职责划分**：适配器仅负责定位 Entity 边界与提取内容；`content/index.ts` 负责 Range 切分；`ShareCard.vue` 统一负责水平/垂直模糊渐变渲染。

### 3. 高清渲染与交互解耦 (Decoupled Rendering Target)
- 导出图片时**绝对不从预览视口（Preview Viewport）中直接截图**，以防手势缩放或平移产生失真与位移；
- 始终通过 `exporter.ts` 将卡片克隆至隐藏的 640px 离屏容器，以 2.5x Retina 比例进行光栅化导出。

### 4. Git 操作准则
- 仅在当前工作分支直接开发（不创建 worktree）；
- **未经用户明确指令（“commit”、“提交”等），严禁擅自执行 `git commit` 或 `git push`**。

---

## 🧪 验证与编译构建 (Verification)

修改代码后必须通过以下两个命令验证：

```bash
# 1. TypeScript 类型校验
pnpm compile

# 2. 生产打包构建
pnpm build
```
确保产物无类型报错与构建错误后方可向用户交付。
