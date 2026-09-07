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

// 平台显示与 Favicon 规范
const platformConfig = computed(() => {
  switch (props.post.platform) {
    case 'zhihu':
      return {
        name: '知乎',
        faviconUrl: 'https://static.zhihu.com/heifetz/favicon.ico',
        badgeBg: 'bg-[#0066ff]/10 text-[#0066ff]',
      };
    case 'x':
      return {
        name: 'X',
        faviconUrl: 'https://abs.twimg.com/favicons/twitter.3.ico',
        badgeBg: 'bg-black/10 dark:bg-white/15 text-current',
      };
    case 'chatgpt':
      return {
        name: 'ChatGPT',
        faviconUrl: 'https://chatgpt.com/favicon.ico',
        badgeBg: 'bg-black/10 dark:bg-white/15 text-current',
      };
    case 'gemini':
      return {
        name: 'Gemini',
        faviconUrl: 'https://www.gstatic.com/lamda/images/gemini_sparkle_4g_512_lt_f94943af3be039176192d.png',
        badgeBg: 'bg-[#1a73e8]/10 text-[#1a73e8] dark:bg-[#1a73e8]/20',
      };
    case 'weibo':
      return {
        name: '微博',
        faviconUrl: 'https://weibo.com/favicon.ico',
        badgeBg: 'bg-[#e6162d]/10 text-[#e6162d]',
      };
    case 'jike':
      return {
        name: '即刻',
        faviconUrl: 'https://web.okjike.com/favicon.ico',
        badgeBg: 'bg-[#ffe411]/20 text-[#333]',
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
        badgeBg: 'bg-slate-500/10 text-slate-600',
      };
    }
  }
});

const isAiPlatform = computed(() => props.post.platform === 'chatgpt' || props.post.platform === 'gemini');
</script>

<template>
  <div
    class="relative overflow-hidden transition-all duration-300 select-text box-border max-w-[640px] w-[640px]"
    :class="[
      currentTheme.backgroundClass,
      currentTheme.fontFamily === 'serif' ? 'font-serif-card' : 'font-sans-card'
    ]"
    :style="{
      padding: `${options.padding}px`,
    }"
  >
    <!-- 卡片主体容器 -->
    <div
      class="rounded-2xl transition-all duration-300 overflow-hidden flex flex-col justify-between box-border w-full"
      :class="[
        currentTheme.cardClass,
        currentTheme.borderClass,
      ]"
      :style="{
        borderRadius: `${options.cardRadius}px`,
        padding: '28px',
      }"
    >
      <!-- Header: 作者信息 & 站点 Favicon 标识 (无分割线) -->
      <div class="flex items-center justify-between gap-3 mb-5 w-full">
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <img
            v-if="post.author.avatarUrl"
            :src="post.author.avatarUrl"
            alt="avatar"
            class="w-11 h-11 object-cover shrink-0 shadow-sm border border-black/5"
            :class="options.authorAvatarRadius"
            crossorigin="anonymous"
          />
          <div
            v-else
            class="w-11 h-11 shrink-0 flex items-center justify-center bg-sky-500 text-white font-bold text-lg"
            :class="options.authorAvatarRadius"
          >
            {{ post.author.name.slice(0, 1) }}
          </div>

          <div class="min-w-0 flex-1">
            <div class="font-bold text-base leading-snug truncate" :class="currentTheme.textClass">
              {{ post.author.name }}
            </div>
            <div
              v-if="post.author.handle"
              class="text-xs truncate opacity-75 mt-0.5"
              :class="currentTheme.subtextClass"
            >
              {{ post.author.handle }}
            </div>
          </div>
        </div>

        <!-- 平台 Favicon Badge (无 border) -->
        <div
          class="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1.5"
          :class="platformConfig.badgeBg"
        >
          <img
            v-if="platformConfig.faviconUrl"
            :src="platformConfig.faviconUrl"
            alt="icon"
            class="w-3.5 h-3.5 object-contain"
            crossorigin="anonymous"
            @error="(e: any) => e.target.style.display = 'none'"
          />
          <span>{{ platformConfig.name }}</span>
        </div>
      </div>

      <!-- Content: 标题（如有）与正文/图文流 -->
      <div class="mb-6 w-full break-words">
        <!-- 1. AI 对话场景：用户提问 Prompt (优雅自适应毛玻璃背景 + 边框 + 左右与正文完全对齐) -->
        <div
          v-if="isAiPlatform && (post.title || post.promptHtml)"
          class="mb-6 w-full rounded-2xl p-4 bg-slate-500/10 dark:bg-white/10 backdrop-blur-md border border-black/10 dark:border-white/15 shadow-sm box-border"
        >
          <div
            class="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider opacity-60 mb-1.5"
            :class="currentTheme.subtextClass"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
            Prompt
          </div>
          <!-- 富文本 Prompt (支持原样文本、全宽高清图片与文件卡片) -->
          <div
            v-if="post.promptHtml"
            class="quick-share-prompt-body text-[14.5px] font-semibold leading-relaxed break-words"
            :class="currentTheme.textClass"
            v-html="post.promptHtml"
          />
          <!-- 纯文本 Prompt 兜底 -->
          <div
            v-else
            class="text-[14.5px] font-semibold leading-relaxed break-words"
            :class="currentTheme.textClass"
          >
            {{ post.title }}
          </div>
        </div>

        <!-- 2. 非 AI 场景：常规文章/帖子标题 -->
        <h3
          v-else-if="post.title"
          class="font-extrabold text-xl leading-snug tracking-tight mb-4 break-words"
          :class="currentTheme.textClass"
        >
          {{ post.title }}
        </h3>
        
        <!-- 1. 划选摘录模式：保留原 DOM 格式，支持段落内水平渐变 + 段落外垂直渐变 -->
        <div v-if="post.isExcerpt" class="w-full">
          <!-- 上方前置段落（垂直顶部淡出渐显 + 微模糊） -->
          <div
            v-if="post.excerptBeforeHtml"
            class="quick-share-excerpt-top-fade quick-share-rich-body select-none pointer-events-none"
            :class="currentTheme.textClass"
            :style="{
              fontSize: `${15 * options.fontScale}px`,
              lineHeight: 1.7,
            }"
            v-html="post.excerptBeforeHtml"
          />

          <!-- 选中的核心段落（完整保留原生 DOM 格式与自然字号，内含文字水平渐显渐隐） -->
          <div
            class="quick-share-rich-body leading-relaxed break-words"
            :class="currentTheme.textClass"
            :style="{
              fontSize: `${15 * options.fontScale}px`,
              lineHeight: 1.7,
            }"
            v-html="post.contentHtml || post.content"
          />

          <!-- 下方后置段落（垂直底部淡出渐隐 + 微模糊） -->
          <div
            v-if="post.excerptAfterHtml"
            class="quick-share-excerpt-bottom-fade quick-share-rich-body select-none pointer-events-none"
            :class="currentTheme.textClass"
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
            class="quick-share-rich-body leading-relaxed break-words"
            :class="currentTheme.textClass"
            :style="{
              fontSize: `${15 * options.fontScale}px`,
              lineHeight: 1.7,
            }"
            v-html="post.contentHtml"
          />

          <!-- 纯文本模式 -->
          <p
            v-else
            class="whitespace-pre-wrap leading-relaxed tracking-normal text-sm break-words"
            :class="currentTheme.textClass"
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
        class="flex flex-col gap-3 mb-6 w-full rounded-xl overflow-hidden"
      >
        <div
          v-for="(item, idx) in post.media"
          :key="idx"
          class="w-full bg-black/5 overflow-hidden rounded-xl"
        >
          <img
            :src="item.url"
            alt="media"
            class="w-full h-auto object-contain rounded-xl block mx-auto"
            crossorigin="anonymous"
          />
        </div>
      </div>

      <!-- Footer: 清洗后 URL 链接与品牌水印 (纯净无二维码) -->
      <div
        class="pt-2 flex items-end justify-between gap-4 text-xs opacity-90 w-full"
        :class="currentTheme.subtextClass"
      >
        <div class="space-y-1 min-w-0 flex-1 pr-2">
          <!-- 干净清晰的 URL 链接（非私有 AI 对话时展示，便于 OCR 与直接点击） -->
          <div
            v-if="post.url && !isAiPlatform"
            class="font-mono text-[11px] leading-tight break-all opacity-80 select-all"
          >
            {{ post.url }}
          </div>
          <div v-if="options.showWatermark" class="font-medium tracking-tight opacity-75 text-[11px]">
            Shared via QuickShare
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 垂直顶部前置上下文：固定高度 + 底部对齐（使紧邻选区的文字完整贴合不被截断） + 顶部完全透明渐变 */
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
}

/* 垂直底部后置上下文：固定高度 + 顶部对齐（使紧邻选区的文字完整贴合不被截断） + 底部完全透明渐变 */
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
}

/* 段落内部：前置文字水平淡入渐显与微模糊 */
:deep(.quick-share-inline-fade-in) {
  display: inline;
  opacity: 0.4;
  filter: blur(0.4px);
  background: linear-gradient(to right, transparent 0%, currentColor 95%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 段落内部：选中的核心文字，100% 锐利高亮，不施加多余加粗或特殊字号 */
:deep(.quick-share-spotlight) {
  display: inline;
  opacity: 1;
  filter: none;
}

/* 段落内部：后置文字水平淡出渐隐与微模糊 */
:deep(.quick-share-inline-fade-out) {
  display: inline;
  opacity: 0.4;
  filter: blur(0.4px);
  background: linear-gradient(to right, currentColor 5%, transparent 100%);
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

/* 富文本流内图片与段落排版 (高度自然撑开，无 max-height 限制) */
:deep(.quick-share-rich-body p) {
  margin-bottom: 0.85em;
  word-break: break-word;
}

:deep(.quick-share-rich-body blockquote) {
  padding: 8px 16px;
  margin-top: 14px;
  margin-bottom: 14px;
  border-left: 3px solid currentColor;
  background-color: rgba(120, 120, 120, 0.08);
  border-radius: 0 8px 8px 0;
  opacity: 0.9;
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

:deep(.quick-share-rich-body h2),
:deep(.quick-share-rich-body h3) {
  font-weight: 700;
  margin-top: 1.2em;
  margin-bottom: 0.5em;
}

:deep(.quick-share-rich-body a) {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 3px;
  opacity: 0.85;
}

:deep(.quick-share-rich-body pre),
:deep(.quick-share-rich-body code) {
  background-color: rgba(128, 128, 128, 0.12);
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

:deep(.quick-share-rich-body pre) {
  padding: 12px;
  margin: 12px 0;
  overflow-x: auto;
}

:deep(.quick-share-rich-body code) {
  padding: 2px 4px;
}

/* 表格排版与边框美化 */
:deep(.quick-share-rich-body table) {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 14px 0;
  font-size: 0.88em;
  line-height: 1.55;
  border: 1px solid rgba(120, 120, 120, 0.3);
  border-radius: 8px;
  overflow: hidden;
}

:deep(.quick-share-rich-body th),
:deep(.quick-share-rich-body td) {
  border-right: 1px solid rgba(120, 120, 120, 0.25);
  border-bottom: 1px solid rgba(120, 120, 120, 0.25);
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
  background-color: rgba(120, 120, 120, 0.12);
  font-weight: 700;
}

:deep(.quick-share-rich-body tr:nth-child(even)) {
  background-color: rgba(120, 120, 120, 0.04);
}

/* Prompt 内部图片与文件附件排版 (图片全宽、自适应高度清晰呈现，文件卡片保真) */
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
  background-color: rgba(128, 128, 128, 0.12);
  border: 1px solid rgba(128, 128, 128, 0.18);
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
</style>
