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
      <div class="space-y-3 mb-6 w-full break-words">
        <!-- 标题 -->
        <h3
          v-if="post.title"
          class="font-extrabold text-xl leading-snug tracking-tight mb-3 break-words"
          :class="currentTheme.textClass"
        >
          {{ post.title }}
        </h3>
        
        <!-- 1. 富文本图文混排模式 -->
        <div
          v-if="post.contentHtml"
          class="quick-share-rich-body leading-relaxed break-words overflow-hidden"
          :class="currentTheme.textClass"
          :style="{
            fontSize: `${15 * options.fontScale}px`,
            lineHeight: 1.7,
          }"
          v-html="post.contentHtml"
        />

        <!-- 2. 纯文本模式 -->
        <p
          v-else
          class="whitespace-pre-wrap leading-relaxed tracking-normal text-sm break-words overflow-hidden"
          :class="currentTheme.textClass"
          :style="{
            fontSize: `${15 * options.fontScale}px`,
            lineHeight: 1.7,
          }"
        >
          {{ post.content }}
        </p>
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
          <!-- 干净清晰的 URL 链接（便于 OCR 与直接点击） -->
          <div
            v-if="post.url"
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
/* 富文本流内图片与段落排版 (高度自然撑开，无 max-height 限制) */
:deep(.quick-share-rich-body p) {
  margin-bottom: 0.85em;
  word-break: break-word;
}

:deep(.quick-share-rich-body blockquote) {
  padding: 8px 16px;
  margin: 12px 0;
  border-left: 3px solid rgba(14, 165, 233, 0.6);
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 0 8px 8px 0;
  opacity: 0.9;
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

:deep(.quick-share-rich-body h2),
:deep(.quick-share-rich-body h3) {
  font-weight: 700;
  margin-top: 1.2em;
  margin-bottom: 0.5em;
}

:deep(.quick-share-rich-body pre),
:deep(.quick-share-rich-body code) {
  background-color: rgba(0, 0, 0, 0.05);
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
</style>
