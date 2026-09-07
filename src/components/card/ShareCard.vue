<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import type { PostData } from '@/types/post';
import { type CardRenderOptions, PRESET_THEMES } from '@/types/theme';
import QRCode from 'qrcode';

const props = defineProps<{
  post: PostData;
  options: CardRenderOptions;
}>();

const currentTheme = computed(() => {
  return PRESET_THEMES[props.options.themeId] || PRESET_THEMES['gradient-sunset'];
});

const qrCodeDataUrl = ref<string>('');

const generateQr = async () => {
  if (props.options.showQrCode && props.post.url) {
    try {
      qrCodeDataUrl.value = await QRCode.toDataURL(props.post.url, {
        margin: 1,
        width: 128,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    } catch (e) {
      console.error('[QuickShare] Failed to generate QR Code:', e);
    }
  }
};

onMounted(generateQr);
watch(() => [props.options.showQrCode, props.post.url], generateQr);

// 平台显示配置（Icon + 纯中文/极简名称）
const platformConfig = computed(() => {
  switch (props.post.platform) {
    case 'zhihu':
      return {
        name: '知乎',
        badgeBg: 'bg-[#0066ff]/10 text-[#0066ff]',
      };
    case 'x':
      return {
        name: 'X',
        badgeBg: 'bg-black/10 dark:bg-white/15 text-current',
      };
    case 'weibo':
      return {
        name: '微博',
        badgeBg: 'bg-[#e6162d]/10 text-[#e6162d]',
      };
    case 'jike':
      return {
        name: '即刻',
        badgeBg: 'bg-[#ffe411]/20 text-[#333]',
      };
    default:
      return {
        name: '网页快照',
        badgeBg: 'bg-slate-500/10 text-slate-600',
      };
  }
});
</script>

<template>
  <div
    class="relative overflow-hidden transition-all duration-300 select-text"
    :class="[
      currentTheme.backgroundClass,
      currentTheme.fontFamily === 'serif' ? 'font-serif-card' : 'font-sans-card'
    ]"
    :style="{
      padding: `${options.padding}px`,
      width: '620px',
    }"
  >
    <!-- 卡片主体容器 -->
    <div
      class="rounded-2xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
      :class="[
        currentTheme.cardClass,
        currentTheme.borderClass,
      ]"
      :style="{
        borderRadius: `${options.cardRadius}px`,
        padding: '28px',
      }"
    >
      <!-- Header: 作者信息 & 平台标识 (无分割线) -->
      <div class="flex items-center justify-between gap-3 mb-5">
        <div class="flex items-center gap-3 min-w-0">
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

          <div class="min-w-0">
            <div class="font-bold text-base leading-snug truncate" :class="currentTheme.textClass">
              {{ post.author.name }}
            </div>
            <div class="text-xs truncate opacity-75 mt-0.5" :class="currentTheme.subtextClass">
              {{ post.author.handle || post.createdAt || platformConfig.name }}
            </div>
          </div>
        </div>

        <!-- 平台胶囊 Badge (去 border，带 Logo) -->
        <div
          class="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1.5"
          :class="platformConfig.badgeBg"
        >
          <!-- 知乎 Logo -->
          <svg
            v-if="post.platform === 'zhihu'"
            class="w-3.5 h-3.5 fill-current"
            viewBox="0 0 24 24"
          >
            <path d="M5.938 3.5v3.125h3.125v1.875H5.938v3.125h4.375V13.5H4.062V1.625h6.25V3.5H5.938zm5.624 8.75c-.776 2.052-2.128 3.754-3.924 4.887L6.25 15.5c1.875-1.125 3.125-2.875 3.75-4.875l1.562 1.625zm6.563-8.75V1.625h-5.625v13.75h1.875V8.125h2.812l3.438 7.25h2.188l-3.75-7.875c1.25-.625 2.187-1.875 2.5-3.625h-3.438V3.5zm0 1.875h1.563c-.313 1-.938 1.563-1.563 1.875V5.375z"/>
          </svg>
          <!-- X Logo -->
          <svg
            v-else-if="post.platform === 'x'"
            class="w-3 h-3 fill-current"
            viewBox="0 0 24 24"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          <!-- 通用 Web Icon -->
          <svg
            v-else
            class="w-3.5 h-3.5 stroke-current fill-none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
            <path d="M2 12h20"/>
          </svg>
          <span>{{ platformConfig.name }}</span>
        </div>
      </div>

      <!-- Content: 标题（如有）与正文/图文流 -->
      <div class="space-y-3 mb-6">
        <!-- 标题 -->
        <h3
          v-if="post.title"
          class="font-extrabold text-xl leading-snug tracking-tight mb-3"
          :class="currentTheme.textClass"
        >
          {{ post.title }}
        </h3>
        
        <!-- 1. 富文本图文混排模式 (优先保留原回答结构与图片穿插) -->
        <div
          v-if="post.contentHtml"
          class="quick-share-rich-body leading-relaxed"
          :class="currentTheme.textClass"
          :style="{
            fontSize: `${15 * options.fontScale}px`,
            lineHeight: 1.7,
          }"
          v-html="post.contentHtml"
        />

        <!-- 2. 纯文本模式 (Fallback) -->
        <p
          v-else
          class="whitespace-pre-wrap leading-relaxed tracking-normal text-sm"
          :class="currentTheme.textClass"
          :style="{
            fontSize: `${15 * options.fontScale}px`,
            lineHeight: 1.7,
          }"
        >
          {{ post.content }}
        </p>
      </div>

      <!-- Media: 仅当非 HTML 模式且有独立 media 时渲染末尾网格 -->
      <div
        v-if="!post.contentHtml && post.media && post.media.length > 0"
        class="grid gap-2 mb-6 rounded-xl overflow-hidden"
        :class="{
          'grid-cols-1': post.media.length === 1,
          'grid-cols-2': post.media.length >= 2,
        }"
      >
        <div
          v-for="(item, idx) in post.media.slice(0, 4)"
          :key="idx"
          class="relative aspect-[4/3] bg-black/5 overflow-hidden rounded-lg"
        >
          <img
            :src="item.url"
            alt="media"
            class="w-full h-full object-cover"
            crossorigin="anonymous"
          />
        </div>
      </div>

      <!-- Footer: 时间戳、二维码与品牌水印 (无 border 干扰) -->
      <div
        class="pt-2 flex items-end justify-between gap-4 text-xs opacity-90"
        :class="currentTheme.subtextClass"
      >
        <div class="space-y-1">
          <div v-if="post.createdAt" class="opacity-80">
            {{ post.createdAt }}
          </div>
          <div v-if="options.showWatermark" class="font-medium tracking-tight opacity-75">
            Shared via Quick Share
          </div>
        </div>

        <!-- 二维码 -->
        <div v-if="options.showQrCode && qrCodeDataUrl" class="flex flex-col items-center shrink-0">
          <img
            :src="qrCodeDataUrl"
            alt="QR Code"
            class="w-14 h-14 p-1 bg-white rounded-md shadow-sm"
          />
          <span class="text-[10px] mt-1 scale-90 opacity-75">扫码查看原文</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 富文本流内图片与段落排版 */
:deep(.quick-share-rich-body p) {
  margin-bottom: 0.85em;
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
  max-width: 100%;
  height: auto;
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
