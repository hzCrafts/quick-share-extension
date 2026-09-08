<script setup lang="ts">
import { computed } from 'vue';
import type { PostData } from '@/types/post';
import { type CardRenderOptions, PRESET_THEMES } from '@/types/theme';

const props = defineProps<{
  post: PostData;
  options: CardRenderOptions;
}>();

const currentTheme = computed(() => {
  return PRESET_THEMES[props.options.themeId] || PRESET_THEMES['gradient-sunset'];
});

// 计算卡片专属 CSS 变量字典
const themeCssVars = computed(() => {
  const t = currentTheme.value.tokens;
  const isSerif = t.fontFamily === 'serif';
  return {
    '--qs-outer-bg': t.outerBackground,
    '--qs-card-bg': t.cardBackground,
    '--qs-card-backdrop-filter': t.cardBackdropFilter,
    '--qs-card-border': t.cardBorder,
    '--qs-card-shadow': t.cardShadow,
    '--qs-text-primary': t.textPrimary,
    '--qs-text-secondary': t.textSecondary,
    '--qs-prompt-bg': t.promptBg,
    '--qs-prompt-border': t.promptBorder,
    '--qs-quote-bg': t.quoteBg,
    '--qs-quote-border': t.quoteBorder,
    '--qs-code-bg': t.codeBg,
    '--qs-code-text': t.codeText,
    '--qs-table-border': t.tableBorder,
    '--qs-table-header-bg': t.tableHeaderBg,
    '--qs-table-row-even-bg': t.tableRowEvenBg,
    '--qs-font-family': isSerif
      ? "Charter, Georgia, Cambria, 'Times New Roman', Times, serif"
      : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    '--qs-padding': `${props.options.padding}px`,
    '--qs-card-radius': `${props.options.cardRadius}px`,
  };
});

const avatarRadiusStyle = computed(() => {
  switch (props.options.authorAvatarRadius) {
    case 'rounded-full':
      return { borderRadius: '9999px' };
    case 'rounded-xl':
      return { borderRadius: '12px' };
    case 'rounded-none':
    default:
      return { borderRadius: '0px' };
  }
});

// 平台显示与 Favicon 规范 (基于主题 isDark 与品牌色自动计算，无 Tailwind dark: 依赖)
const platformConfig = computed(() => {
  const isDark = currentTheme.value.tokens.isDark;
  switch (props.post.platform) {
    case 'zhihu':
      return {
        name: '知乎',
        faviconUrl: 'https://static.zhihu.com/heifetz/favicon.ico',
        style: {
          backgroundColor: isDark ? 'rgba(0, 102, 255, 0.22)' : 'rgba(0, 102, 255, 0.10)',
          color: isDark ? '#60a5fa' : '#0066ff',
        },
      };
    case 'x':
      return {
        name: 'X',
        faviconUrl: 'https://abs.twimg.com/favicons/twitter.3.ico',
        style: {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
          color: isDark ? '#ffffff' : '#0f172a',
        },
      };
    case 'chatgpt':
      return {
        name: 'ChatGPT',
        faviconUrl: 'https://chatgpt.com/favicon.ico',
        style: {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
          color: isDark ? '#ffffff' : '#0f172a',
        },
      };
    case 'gemini':
      return {
        name: 'Gemini',
        faviconUrl: 'https://www.gstatic.com/lamda/images/gemini_sparkle_4g_512_lt_f94943af3be039176192d.png',
        style: {
          backgroundColor: isDark ? 'rgba(26, 115, 232, 0.25)' : 'rgba(26, 115, 232, 0.10)',
          color: isDark ? '#93c5fd' : '#1a73e8',
        },
      };
    case 'weibo':
      return {
        name: '微博',
        faviconUrl: 'https://weibo.com/favicon.ico',
        style: {
          backgroundColor: isDark ? 'rgba(230, 22, 45, 0.22)' : 'rgba(230, 22, 45, 0.10)',
          color: isDark ? '#f87171' : '#e6162d',
        },
      };
    case 'jike':
      return {
        name: '即刻',
        faviconUrl: 'https://web.okjike.com/favicon.ico',
        style: {
          backgroundColor: isDark ? 'rgba(255, 228, 17, 0.25)' : 'rgba(255, 228, 17, 0.20)',
          color: isDark ? '#fef08a' : '#333333',
        },
      };
    default: {
      let hostFavicon = '';
      try {
        const host = new URL(props.post.url).hostname;
        hostFavicon = `https://${host}/favicon.ico`;
      } catch {
        hostFavicon = '';
      }
      return {
        name: '网页',
        faviconUrl: hostFavicon,
        style: {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(100, 116, 139, 0.10)',
          color: isDark ? '#cbd5e1' : '#475569',
        },
      };
    }
  }
});

const isAiPlatform = computed(() => props.post.platform === 'chatgpt' || props.post.platform === 'gemini');
</script>

<template>
  <!-- 卡片外层包装容器 (支持直角外层背景衬底) -->
  <div
    class="qs-card-wrapper"
    :class="{ 'has-outer-padding': options.showOuterPadding }"
    :style="themeCssVars"
  >
    <!-- 卡片主体 (浮起在背景上的圆角卡片) -->
    <div class="qs-card">
      <!-- Header: 作者信息 & 站点 Favicon 标识 -->
      <div class="qs-card-header">
        <div class="qs-author-box">
          <img
            v-if="post.author.avatarUrl"
            :src="post.author.avatarUrl"
            alt="avatar"
            class="qs-avatar-img"
            :style="avatarRadiusStyle"
            crossorigin="anonymous"
          />
          <div
            v-else
            class="qs-avatar-fallback"
            :style="avatarRadiusStyle"
          >
            {{ post.author.name.slice(0, 1) }}
          </div>

          <div class="qs-author-meta">
            <div class="qs-author-name">
              {{ post.author.name }}
            </div>
            <div
              v-if="post.author.handle"
              class="qs-author-handle"
            >
              {{ post.author.handle }}
            </div>
          </div>
        </div>

        <!-- 平台 Favicon Badge (非 AI 对话平台展示，AI 场景左侧专属头像与品牌已足够) -->
        <div
          v-if="!isAiPlatform"
          class="qs-platform-badge"
          :style="platformConfig.style"
        >
          <img
            v-if="platformConfig.faviconUrl"
            :src="platformConfig.faviconUrl"
            alt="icon"
            class="qs-platform-icon"
            crossorigin="anonymous"
            @error="(e: any) => e.target.style.display = 'none'"
          />
          <span>{{ platformConfig.name }}</span>
        </div>
      </div>

      <!-- Content: 标题（如有）与正文/图文流 -->
      <div class="qs-card-content">
        <!-- 1. AI 对话场景：用户提问 Prompt (纯 CSS 变量毛玻璃背景与边框) -->
        <div
          v-if="isAiPlatform && (post.title || post.promptHtml)"
          class="qs-prompt-container"
        >
          <div class="qs-prompt-header">
            <span class="qs-prompt-dot"></span>
            Prompt
          </div>
          <!-- 富文本 Prompt (支持原样文本、全宽高清图片与文件卡片) -->
          <div
            v-if="post.promptHtml"
            class="quick-share-prompt-body"
            v-html="post.promptHtml"
          />
          <!-- 纯文本 Prompt 兜底 -->
          <div
            v-else
            class="qs-prompt-plain"
          >
            {{ post.title }}
          </div>
        </div>

        <!-- 2. 非 AI 场景：常规文章/帖子标题 -->
        <h3
          v-else-if="post.title"
          class="qs-post-title"
        >
          {{ post.title }}
        </h3>
        
        <!-- 1. 划选摘录模式：保留原 DOM 格式，支持段落内水平渐变 + 段落外垂直渐变 -->
        <div v-if="post.isExcerpt" class="qs-excerpt-wrapper">
          <!-- 上方前置段落（垂直顶部淡出渐显 + 微模糊） -->
          <div
            v-if="post.excerptBeforeHtml"
            class="quick-share-excerpt-top-fade quick-share-rich-body"
            :style="{
              fontSize: `${15 * options.fontScale}px`,
              lineHeight: 1.7,
            }"
            v-html="post.excerptBeforeHtml"
          />

          <!-- 选中的核心段落（完整保留原生 DOM 格式与自然字号，内含文字水平渐显渐隐） -->
          <div
            class="quick-share-rich-body"
            :style="{
              fontSize: `${15 * options.fontScale}px`,
              lineHeight: 1.7,
            }"
            v-html="post.contentHtml || post.content"
          />

          <!-- 下方后置段落（垂直底部淡出渐隐 + 微模糊） -->
          <div
            v-if="post.excerptAfterHtml"
            class="quick-share-excerpt-bottom-fade quick-share-rich-body"
            :style="{
              fontSize: `${15 * options.fontScale}px`,
              lineHeight: 1.7,
            }"
            v-html="post.excerptAfterHtml"
          />
        </div>

        <!-- 2. 全文分享模式 -->
        <template v-else>
          <!-- 富文本图文混排模式 -->
          <div
            v-if="post.contentHtml"
            class="quick-share-rich-body"
            :style="{
              fontSize: `${15 * options.fontScale}px`,
              lineHeight: 1.7,
            }"
            v-html="post.contentHtml"
          />

          <!-- 纯文本模式 -->
          <p
            v-else
            class="qs-plain-content"
            :style="{
              fontSize: `${15 * options.fontScale}px`,
              lineHeight: 1.7,
            }"
          >
            {{ post.content }}
          </p>
        </template>
      </div>

      <!-- Media: X / 纯文本模式下的图片 (100% 宽度，高度自动撑高) -->
      <div
        v-if="!post.contentHtml && post.media && post.media.length > 0"
        class="qs-media-gallery"
      >
        <div
          v-for="(item, idx) in post.media"
          :key="idx"
          class="qs-media-item"
        >
          <img
            :src="item.url"
            alt="media"
            class="qs-media-img"
            crossorigin="anonymous"
          />
        </div>
      </div>

      <!-- Footer: 清洗后 URL 链接 -->
      <div
        v-if="post.url && !isAiPlatform"
        class="qs-card-footer"
      >
        <div class="qs-footer-url">
          {{ post.url }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 卡片外层包装容器 (标准 720px 物理排版宽度，外层 100% 直角) */
.qs-card-wrapper {
  position: relative;
  box-sizing: border-box;
  user-select: text;
  width: 720px;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  background: transparent;
  padding: 0;
  border-radius: 0px !important;
  font-family: var(--qs-font-family);
  color: var(--qs-text-primary);
}

/* 开启背景边距：外层四个角彻底直角 (border-radius: 0)，填充 48px 主题外层背景衬底 */
.qs-card-wrapper.has-outer-padding {
  background: var(--qs-outer-bg);
  padding: 48px;
  border-radius: 0px !important;
}

/* 卡片主体容器 (圆角、浮起大阴影、内边距) */
.qs-card {
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: var(--qs-card-bg);
  border: var(--qs-card-border);
  box-shadow: var(--qs-card-shadow);
  backdrop-filter: var(--qs-card-backdrop-filter);
  -webkit-backdrop-filter: var(--qs-card-backdrop-filter);
  border-radius: var(--qs-card-radius);
  padding: var(--qs-padding);
  color: var(--qs-text-primary);
}

/* Header */
.qs-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
  width: 100%;
}

.qs-author-box {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.qs-avatar-img {
  width: 44px;
  height: 44px;
  object-fit: cover;
  flex-shrink: 0;
  box-shadow: none;
  border: none;
  background: transparent;
}

.qs-avatar-fallback {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #0284c7;
  color: #ffffff;
  font-weight: 700;
  font-size: 18px;
}

.qs-author-meta {
  min-width: 0;
  flex: 1;
}

.qs-author-name {
  font-weight: 700;
  font-size: 16px;
  line-height: 1.35;
  color: var(--qs-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qs-author-handle {
  font-size: 12px;
  color: var(--qs-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
  opacity: 0.85;
}

/* 平台 Badge */
.qs-platform-badge {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.025em;
  display: flex;
  align-items: center;
  gap: 6px;
}

.qs-platform-icon {
  width: 14px;
  height: 14px;
  object-fit: contain;
}

/* Content */
.qs-card-content {
  margin-bottom: 24px;
  width: 100%;
  word-break: break-word;
}

.qs-post-title {
  font-weight: 800;
  font-size: 20px;
  line-height: 1.35;
  letter-spacing: -0.015em;
  margin-top: 0;
  margin-bottom: 16px;
  color: var(--qs-text-primary);
  word-break: break-word;
}

/* AI Prompt 区域 */
.qs-prompt-container {
  margin-bottom: 24px;
  width: 100%;
  border-radius: 16px;
  padding: 16px;
  background: var(--qs-prompt-bg);
  border: var(--qs-prompt-border);
  box-sizing: border-box;
}

.qs-prompt-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--qs-text-secondary);
  margin-bottom: 6px;
}

.qs-prompt-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
  opacity: 0.7;
}

.qs-prompt-plain {
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1.6;
  color: var(--qs-text-primary);
  word-break: break-word;
}

.qs-plain-content {
  white-space: pre-wrap;
  line-height: 1.7;
  font-size: 15px;
  color: var(--qs-text-primary);
  word-break: break-word;
  margin: 0;
}

/* 划选 Excerpt 上下文 */
.qs-excerpt-wrapper {
  width: 100%;
}

.quick-share-excerpt-top-fade {
  height: 64px;
  max-height: 64px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  opacity: 0.35;
  filter: blur(0.35px);
  position: relative;
  mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.45) 40%,
    rgba(0, 0, 0, 1) 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.45) 40%,
    rgba(0, 0, 0, 1) 100%
  );
  margin-bottom: 6px;
  user-select: none;
  pointer-events: none;
}

.quick-share-excerpt-bottom-fade {
  height: 64px;
  max-height: 64px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  opacity: 0.35;
  filter: blur(0.35px);
  position: relative;
  mask-image: linear-gradient(
    to top,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.45) 40%,
    rgba(0, 0, 0, 1) 100%
  );
  -webkit-mask-image: linear-gradient(
    to top,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.45) 40%,
    rgba(0, 0, 0, 1) 100%
  );
  margin-top: 6px;
  user-select: none;
  pointer-events: none;
}

/* 段落内部：前置文字水平淡入渐显与微模糊 */
:deep(.quick-share-inline-fade-in) {
  display: inline;
  opacity: 0.4;
  filter: blur(0.4px);
  background: linear-gradient(to right, transparent 0%, var(--qs-text-primary) 95%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 段落内部：选中的核心文字，100% 锐利高亮 */
:deep(.quick-share-spotlight) {
  display: inline;
  opacity: 1;
  filter: none;
  color: var(--qs-text-primary);
}

/* 段落内部：后置文字水平淡出渐隐与微模糊 */
:deep(.quick-share-inline-fade-out) {
  display: inline;
  opacity: 0.4;
  filter: blur(0.4px);
  background: linear-gradient(to right, var(--qs-text-primary) 5%, transparent 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 忽略上下文中的多余图片与按钮以维持纯净书摘质感 */
:deep(.quick-share-excerpt-top-fade img),
:deep(.quick-share-excerpt-bottom-fade img),
:deep(.quick-share-excerpt-top-fade button),
:deep(.quick-share-excerpt-bottom-fade button),
:deep(.cdk-visually-hidden),
:deep(.visually-hidden),
:deep(.sr-only),
:deep([class*="visually-hidden"]),
:deep([class*="screen-reader"]),
:deep(.model-response-header),
:deep([class*="model-response-header"]) {
  display: none !important;
}

/* 富文本容器：统一字色与继承重置 */
.quick-share-rich-body {
  color: var(--qs-text-primary);
  line-height: 1.7;
  word-break: break-word;
}

:deep(.quick-share-rich-body) {
  color: var(--qs-text-primary);
}

:deep(.quick-share-rich-body *) {
  color: inherit;
}

:deep(.quick-share-rich-body p) {
  margin-top: 0;
  margin-bottom: 0.85em;
  word-break: break-word;
}

:deep(.quick-share-rich-body blockquote) {
  padding: 10px 16px;
  margin-top: 14px;
  margin-bottom: 14px;
  border-left: 3.5px solid var(--qs-quote-border);
  background-color: var(--qs-quote-bg);
  border-radius: 0 8px 8px 0;
  opacity: 0.95;
}

:deep(.quick-share-rich-body blockquote p:last-child) {
  margin-bottom: 0;
}

:deep(.quick-share-rich-body .quick-share-rich-img) {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
  object-fit: contain;
  border-radius: 12px;
  margin: 14px auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

:deep(.quick-share-rich-body ul) {
  list-style-type: disc;
  padding-left: 1.5em;
  margin: 0.8em 0;
}

:deep(.quick-share-rich-body ol) {
  list-style-type: decimal;
  padding-left: 1.5em;
  margin: 0.8em 0;
}

:deep(.quick-share-rich-body li) {
  margin-bottom: 0.45em;
}

:deep(.quick-share-rich-body li > p) {
  margin-bottom: 0.35em;
}

:deep(.quick-share-rich-body h1),
:deep(.quick-share-rich-body h2),
:deep(.quick-share-rich-body h3) {
  font-weight: 700;
  margin-top: 1.2em;
  margin-bottom: 0.5em;
  color: var(--qs-text-primary);
}

:deep(.quick-share-rich-body a) {
  color: var(--qs-text-primary);
  text-decoration: underline;
  text-underline-offset: 3px;
  opacity: 0.85;
}

:deep(.quick-share-rich-body pre),
:deep(.quick-share-rich-body code),
:deep(.quick-share-rich-body code-block),
:deep(.quick-share-rich-body [class*="code-block"]),
:deep(.quick-share-rich-body [class*="code-container"]) {
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

:deep(.quick-share-rich-body pre),
:deep(.quick-share-rich-body code-block),
:deep(.quick-share-rich-body [class*="code-block"]) {
  background-color: var(--qs-code-bg);
  color: var(--qs-code-text);
  border-radius: 8px;
  padding: 12px 14px;
  margin: 12px 0;
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden !important;
  white-space: pre-wrap !important;
  word-break: break-all !important;
  overflow-wrap: anywhere !important;
  word-wrap: break-word !important;
}

:deep(.quick-share-rich-body pre *),
:deep(.quick-share-rich-body pre code),
:deep(.quick-share-rich-body code-block *),
:deep(.quick-share-rich-body [class*="code-block"] *) {
  white-space: pre-wrap !important;
  word-break: break-all !important;
  overflow-wrap: anywhere !important;
  word-wrap: break-word !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

/* 行内普通 code 标签 (非 pre 内部) */
:deep(.quick-share-rich-body :not(pre) > code),
:deep(.quick-share-rich-body p code),
:deep(.quick-share-rich-body li code) {
  background-color: var(--qs-code-bg);
  color: var(--qs-code-text);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.9em;
  white-space: pre-wrap !important;
  word-break: break-all !important;
  overflow-wrap: anywhere !important;
}

/* 表格排版与边框美化 */
:deep(.quick-share-rich-body table) {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 14px 0;
  font-size: 0.88em;
  line-height: 1.55;
  border: 1px solid var(--qs-table-border);
  border-radius: 8px;
  overflow: hidden;
}

:deep(.quick-share-rich-body th),
:deep(.quick-share-rich-body td) {
  border-right: 1px solid var(--qs-table-border);
  border-bottom: 1px solid var(--qs-table-border);
  padding: 8px 12px;
  text-align: left;
}

:deep(.quick-share-rich-body th:last-child),
:deep(.quick-share-rich-body td:last-child) {
  border-right: none;
}

:deep(.quick-share-rich-body tr:last-child td) {
  border-bottom: none;
}

:deep(.quick-share-rich-body th) {
  background-color: var(--qs-table-header-bg);
  font-weight: 700;
}

:deep(.quick-share-rich-body tr:nth-child(even)) {
  background-color: var(--qs-table-row-even-bg);
}

/* Prompt 内部富文本与图片附件 */
.quick-share-prompt-body {
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1.6;
  color: var(--qs-text-primary);
  word-break: break-word;
}

:deep(.quick-share-prompt-body) {
  color: var(--qs-text-primary);
}

:deep(.quick-share-prompt-body *) {
  color: inherit;
}

:deep(.quick-share-prompt-body p) {
  margin-bottom: 0.5em;
}

:deep(.quick-share-prompt-body p:last-child) {
  margin-bottom: 0;
}

:deep(.quick-share-prompt-body .quick-share-prompt-img),
:deep(.quick-share-prompt-body img) {
  display: block;
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
  max-height: none !important;
  object-fit: contain !important;
  border-radius: 12px;
  margin-top: 10px;
  margin-bottom: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

:deep(.quick-share-prompt-body .quick-share-prompt-file-chip),
:deep(.quick-share-prompt-body mat-card),
:deep(.quick-share-prompt-body [class*="file-preview"]),
:deep(.quick-share-prompt-body [class*="attachment-preview"]),
:deep(.quick-share-prompt-body [class*="file-chip"]) {
  display: flex !important;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  margin-top: 10px;
  margin-bottom: 6px;
  border-radius: 12px;
  background-color: var(--qs-code-bg);
  border: 1px solid var(--qs-prompt-border);
  font-size: 13px;
  font-weight: 500;
  width: 100%;
  box-sizing: border-box;
}

:deep(.quick-share-prompt-body [class*="file-icon"]),
:deep(.quick-share-prompt-body mat-icon) {
  font-size: 20px;
  width: 20px;
  height: 20px;
  opacity: 0.85;
}

/* Media 区域 (推文配图等) */
.qs-media-gallery {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
}

.qs-media-item {
  width: 100%;
  background-color: rgba(0, 0, 0, 0.04);
  border-radius: 12px;
  overflow: hidden;
}

.qs-media-img {
  width: 100%;
  height: auto;
  object-fit: contain;
  border-radius: 12px;
  display: block;
  margin: 0 auto;
}

/* Footer */
.qs-card-footer {
  padding-top: 10px;
  display: flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
}

.qs-footer-url {
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11.5px;
  line-height: 1.4;
  color: var(--qs-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  opacity: 0.85;
  user-select: all;
  letter-spacing: -0.01em;
}
</style>

