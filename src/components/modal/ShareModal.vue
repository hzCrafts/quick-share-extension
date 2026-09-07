<script setup lang="ts">
import { ref, reactive } from 'vue';
import type { PostData } from '@/types/post';
import { type CardRenderOptions, type CardThemeId, PRESET_THEMES } from '@/types/theme';
import ShareCard from '@/components/card/ShareCard.vue';
import { copyCardToClipboard, downloadCardAsPng } from '@/utils/exporter';
import { 
  X, 
  Copy, 
  Download, 
  Check, 
  Sliders, 
  Sparkles, 
  QrCode, 
  Type,
  Layout
} from 'lucide-vue-next';

const props = defineProps<{
  post: PostData;
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

// 卡片渲染配置
const options = reactive<CardRenderOptions>({
  themeId: 'gradient-sunset',
  padding: 32,
  showQrCode: true,
  showWatermark: true,
  showStats: false,
  fontScale: 1.0,
  cardRadius: 16,
  authorAvatarRadius: 'rounded-full',
  aspectRatio: 'auto',
});

const isCopying = ref(false);
const isDownloading = ref(false);
const copySuccess = ref(false);

const handleCopy = async () => {
  const container = document.getElementById('quick-share-export-container');
  if (!container) return;
  try {
    isCopying.value = true;
    await copyCardToClipboard(container, { scale: 2 });
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);
  } catch (err) {
    console.error('复制失败:', err);
    alert('复制到剪切板失败，请尝试直接下载图片');
  } finally {
    isCopying.value = false;
  }
};

const handleDownload = async () => {
  const container = document.getElementById('quick-share-export-container');
  if (!container) return;
  try {
    isDownloading.value = true;
    const filename = `quick-share-${props.post.platform}-${Date.now()}.png`;
    await downloadCardAsPng(container, filename, { scale: 2 });
  } catch (err) {
    console.error('下载失败:', err);
    alert('下载图片失败');
  } finally {
    isDownloading.value = false;
  }
};

const selectTheme = (themeId: CardThemeId) => {
  options.themeId = themeId;
};
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity text-slate-800 font-sans"
    @click.self="emit('close')"
  >
    <!-- 模态框主体 -->
    <div
      class="bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] w-full max-w-5xl overflow-hidden border border-slate-100"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
            <Sparkles class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-base font-bold text-slate-900 leading-none">生成分享卡片</h2>
            <p class="text-xs text-slate-400 mt-1">从 {{ post.platform.toUpperCase() }} 提取内容并美化导出</p>
          </div>
        </div>

        <button
          @click="emit('close')"
          class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Main Body: 左右分栏 (左侧控制台，右侧卡片预览) -->
      <div class="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50/50">
        <!-- 左侧：参数调整控制台 -->
        <div class="w-full md:w-80 border-r border-slate-100 p-5 overflow-y-auto space-y-6 bg-white shrink-0">
          <!-- 1. 主题选择 -->
          <div class="space-y-2.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles class="w-3.5 h-3.5" />
              卡片主题
            </label>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="theme in Object.values(PRESET_THEMES)"
                :key="theme.id"
                @click="selectTheme(theme.id)"
                class="p-2.5 text-left rounded-xl border text-xs font-medium transition-all flex flex-col gap-1.5"
                :class="[
                  options.themeId === theme.id
                    ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/30 font-bold text-sky-900'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                ]"
              >
                <div class="h-4 w-full rounded-md" :class="theme.backgroundClass" />
                <span class="truncate">{{ theme.name }}</span>
              </button>
            </div>
          </div>

          <!-- 2. 布局与间距 -->
          <div class="space-y-3 pt-2 border-t border-slate-100">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Layout class="w-3.5 h-3.5" />
              外层间距
            </label>
            <div class="grid grid-cols-4 gap-1.5">
              <button
                v-for="pad in [16, 24, 32, 48]"
                :key="pad"
                @click="options.padding = pad"
                class="py-1.5 px-2 text-xs rounded-lg border text-center font-medium transition-colors"
                :class="[
                  options.padding === pad
                    ? 'border-sky-500 bg-sky-50 text-sky-600 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                ]"
              >
                {{ pad }}px
              </button>
            </div>
          </div>

          <!-- 3. 文字大小缩放 -->
          <div class="space-y-3 pt-2 border-t border-slate-100">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Type class="w-3.5 h-3.5" />
              字体缩放
            </label>
            <div class="grid grid-cols-4 gap-1.5">
              <button
                v-for="scale in [0.9, 1.0, 1.1, 1.2]"
                :key="scale"
                @click="options.fontScale = scale"
                class="py-1.5 px-2 text-xs rounded-lg border text-center font-medium transition-colors"
                :class="[
                  options.fontScale === scale
                    ? 'border-sky-500 bg-sky-50 text-sky-600 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                ]"
              >
                {{ scale }}x
              </button>
            </div>
          </div>

          <!-- 4. 开关项 -->
          <div class="space-y-3 pt-2 border-t border-slate-100">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders class="w-3.5 h-3.5" />
              元素显示
            </label>
            <div class="space-y-2">
              <label class="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
                <span class="flex items-center gap-1.5">
                  <QrCode class="w-3.5 h-3.5 text-slate-400" />
                  原文二维码
                </span>
                <input
                  type="checkbox"
                  v-model="options.showQrCode"
                  class="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label class="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
                <span>品牌水印</span>
                <input
                  type="checkbox"
                  v-model="options.showWatermark"
                  class="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        <!-- 右侧：实时预览画布区 -->
        <div class="flex-1 p-8 overflow-y-auto flex items-center justify-center bg-slate-100/70">
          <div class="shadow-2xl rounded-2xl overflow-hidden max-w-full">
            <ShareCard
              :post="post"
              :options="options"
            />
          </div>
        </div>
      </div>

      <!-- Footer: 操作栏 -->
      <div class="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
        <span class="text-xs text-slate-400">
          提示：支持直接导出高清 2x 规格图片
        </span>

        <div class="flex items-center gap-3">
          <button
            @click="handleCopy"
            :disabled="isCopying"
            class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <Check v-if="copySuccess" class="w-4 h-4 text-emerald-500" />
            <Copy v-else class="w-4 h-4" />
            <span>{{ copySuccess ? '已复制到剪切板' : isCopying ? '导出中...' : '复制图片' }}</span>
          </button>

          <button
            @click="handleDownload"
            :disabled="isDownloading"
            class="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold shadow-md shadow-sky-500/20 transition-all flex items-center gap-2"
          >
            <Download class="w-4 h-4" />
            <span>{{ isDownloading ? '生成中...' : '下载 PNG' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
