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

// 平台图标/标识
const platformLabel = computed(() => {
  switch (props.post.platform) {
    case 'x': return 'X (Twitter)';
    case 'zhihu': return '知乎 Zhihu';
    case 'jike': return '即刻 Jike';
    case 'weibo': return '微博 Weibo';
    default: return 'Web';
  }
});
</script>

<template>
  <div
    id="quick-share-export-container"
    class="relative overflow-hidden transition-all duration-300"
    :class="[
      currentTheme.backgroundClass,
      currentTheme.fontFamily === 'serif' ? 'font-serif-card' : 'font-sans-card'
    ]"
    :style="{
      padding: `${options.padding}px`,
      width: '600px',
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
        padding: '24px',
      }"
    >
      <!-- Header: 作者信息 & 平台标识 -->
      <div class="flex items-center justify-between gap-3 mb-4">
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
            <div class="text-xs truncate" :class="currentTheme.subtextClass">
              {{ post.author.handle || post.createdAt || platformLabel }}
            </div>
          </div>
        </div>

        <!-- 平台胶囊 Badge -->
        <div
          class="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide border opacity-90"
          :class="[
            currentTheme.borderClass,
            currentTheme.subtextClass
          ]"
        >
          {{ platformLabel }}
        </div>
      </div>

      <!-- Content: 标题（如有）与正文 -->
      <div class="space-y-3 mb-5">
        <h3
          v-if="post.title"
          class="font-bold text-lg leading-snug"
          :class="currentTheme.textClass"
        >
          {{ post.title }}
        </h3>
        
        <p
          class="whitespace-pre-wrap leading-relaxed tracking-normal text-sm"
          :class="currentTheme.textClass"
          :style="{
            fontSize: `${15 * options.fontScale}px`,
            lineHeight: 1.6,
          }"
        >
          {{ post.content }}
        </p>
      </div>

      <!-- Media: 图片网格（1~4张） -->
      <div
        v-if="post.media && post.media.length > 0"
        class="grid gap-2 mb-5 rounded-xl overflow-hidden"
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

      <!-- Footer: 时间戳、二维码与品牌水印 -->
      <div
        class="pt-4 mt-2 border-t flex items-end justify-between gap-3 text-xs"
        :class="[
          currentTheme.borderClass,
          currentTheme.subtextClass
        ]"
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
