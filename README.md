# Quick Share - 社交媒体卡片化分享 Chrome 扩展

一款基于现代前端栈打造的 Chrome 扩展，能够自动识别并注入到主流社交媒体（如 X / Twitter、知乎等）以及通用网页中，一键将帖子内容转换为精美、高分辨率、适合社交媒体传播的分享卡片图。

## ✨ 特性

- 🚀 **现代技术栈**：基于 [WXT (Next-Gen Web Extension Framework)](https://wxt.dev/) + Vue 3 (`<script setup>`) + TypeScript + Tailwind CSS 构建。
- 🛡️ **Shadow DOM 样式隔离**：弹窗与操作浮层渲染在 Shadow DOM 内部，与宿主站点的 CSS 100% 隔离，杜绝样式污染。
- 🧩 **高扩展 Adapter 架构**：模块化站点适配器设计，支持快速接入 X (Twitter)、知乎（问答/专栏/文章）、小红书、即刻等任意站点。
- 🎨 **精美预设主题**：内置 7 种风格迥异的卡片主题（落日余晖、蔚蓝深海、极光冷调、曜石深黑、纯净极简、暖雅宣纸、毛玻璃）。
- ⚙️ **丰富定制选项**：支持外层间距、字体缩放、原文二维码生成、品牌水印、作者头像圆角等灵活配置。
- 📸 **高清图片导出**：基于 `modern-screenshot` 生成高分辨率（2x/3x Retina）PNG 图片，支持直接复制到系统剪切板与一键下载。
- 🌐 **多维度触发**：
  - 站点内容操作栏自动注入的 QuickShare 按钮
  - 网页划选文字自动浮现的悬浮快捷按钮 (Floating Trigger)
  - 网页划选右键上下文菜单引述分享

---

## 📚 开发规范与文档 (SSOT)

- 🤖 **[AGENTS.md](./AGENTS.md)**：Agent 与开发者全景指南、核心规范与架构设计
- 📌 **[docs/adapter-guidelines.md](./docs/adapter-guidelines.md)**：站点适配器接入与金句分享 SSOT 规范

---

## 🏗️ 项目架构

```
src/
├── adapters/               # 站点适配器层
│   ├── base.ts             # BaseAdapter 抽象基类与 ExcerptSelection
│   ├── x.adapter.ts        # X (Twitter) 适配器
│   ├── zhihu.adapter.ts    # 知乎问答与专栏文章适配器
│   └── index.ts            # 适配器注册与匹配中心
├── assets/                 # 样式与静态资源
│   └── style.css           # Tailwind 基础与卡片排版样式
├── components/             # Vue 组件
│   ├── card/
│   │   └── ShareCard.vue   # 卡片渲染主体（主题、富文本、双向渐隐渲染）
│   └── modal/
│       └── ShareModal.vue  # 定制控制台与实时预览模态框（支持 640px 离屏高清导出）
├── entrypoints/            # WXT 入口定义
│   ├── background.ts       # 后台 Service Worker（右键菜单、扩展生命周期）
│   ├── content/            # Content Script（Shadow DOM 挂载、选区监听、划词悬浮按钮）
│   │   ├── App.vue
│   │   └── index.ts
│   └── popup/              # 扩展工具栏状态展示 Popup
├── types/                  # TypeScript 类型定义
│   ├── post.ts             # PostData 结构化契约
│   └── theme.ts            # 主题与渲染选项
└── utils/                  # 导出与通用工具
    ├── exporter.ts         # modern-screenshot 离屏高清导出与剪切板管理
    └── url.ts              # 规范 URL 营销参数清洗器 (cleanShareUrl)
```

---

## 🛠️ 本地开发与构建

### 1. 安装依赖
```bash
pnpm install
```

### 2. 启动开发环境（带热更新 HMR）
```bash
pnpm dev
```
启动后会输出 `.output/chrome-mv3` 目录，并在开发时自动监听文件变更。

### 3. 在 Chrome 中加载扩展
1. 打开 Chrome 浏览器，访问 `chrome://extensions/`。
2. 开启右上角的 **“开发者模式” (Developer mode)**。
3. 点击左上角 **“加载已解压的扩展程序” (Load unpacked)**。
4. 选择当前项目下的 `.output/chrome-mv3` 文件夹。

### 4. 生产构建打包
```bash
pnpm build
```
产物将输出在 `.output/chrome-mv3` 中；如需发布 zip 包可执行 `pnpm zip`。
