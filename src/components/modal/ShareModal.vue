<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue';
import type { PostData } from '@/types/post';
import { type CardRenderOptions, type CardThemeId, PRESET_THEMES } from '@/types/theme';
import ShareCard from '@/components/card/ShareCard.vue';
import { domToBlob, domToPng } from 'modern-screenshot';
import { 
  X, 
  Copy, 
  Download, 
  Check, 
  Sliders, 
  Sparkles, 
  QrCode, 
  Type,
  Layout,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Loader2,
  Move
} from 'lucide-vue-next';

const props = defineProps<{
  post: PostData;
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

// 离屏真实未缩放渲染源
const offscreenCardRef = ref<HTMLElement | null>(null);
const viewportRef = ref<HTMLElement | null>(null);

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

// 生成的高清预览图片
const previewDataUrl = ref<string>('');
const previewBlob = ref<Blob | null>(null);
const imageNaturalWidth = ref<number>(0);
const imageNaturalHeight = ref<number>(0);
const isRendering = ref<boolean>(false);

// 图片查看器变换状态（平移与缩放）
const scale = ref<number>(1);
const fitScale = ref<number>(1);
const translateX = ref<number>(0);
const translateY = ref<number>(0);
const isDragging = ref<boolean>(false);
const dragStartX = ref<number>(0);
const dragStartY = ref<number>(0);
const initialTranslateX = ref<number>(0);
const initialTranslateY = ref<number>(0);

// 操作状态
const isCopying = ref(false);
const isDownloading = ref(false);
const copySuccess = ref(false);

/**
 * 触发离屏真实 DOM 渲染为高清图片
 */
let renderTimer: any = null;
const triggerRender = () => {
  if (renderTimer) clearTimeout(renderTimer);
  isRendering.value = true;
  renderTimer = setTimeout(async () => {
    if (!offscreenCardRef.value) return;
    try {
      // 预留微任务等待 Vue DOM 更新与外部字体/图片加载
      await nextTick();
      await new Promise((r) => setTimeout(r, 120));

      const blob = await domToBlob(offscreenCardRef.value, {
        scale: 2,
        quality: 0.95,
        type: 'image/png',
        features: {
          removeControlCharacter: true,
        },
      });

      if (blob) {
        previewBlob.value = blob;
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          imageNaturalWidth.value = img.naturalWidth / 2; // 回到 1x 逻辑像素
          imageNaturalHeight.value = img.naturalHeight / 2;
          previewDataUrl.value = url;
          isRendering.value = false;
          nextTick(resetToFit);
        };
        img.src = url;
      }
    } catch (err) {
      console.error('[QuickShare] Render failed:', err);
      isRendering.value = false;
    }
  }, 100);
};

/**
 * 重置为自适应全图居中（头尾完全可见）
 */
const resetToFit = () => {
  if (!viewportRef.value || !imageNaturalWidth.value || !imageNaturalHeight.value) return;
  const vWidth = viewportRef.value.clientWidth - 40;
  const vHeight = viewportRef.value.clientHeight - 40;

  if (vWidth > 0 && vHeight > 0) {
    const scaleX = vWidth / imageNaturalWidth.value;
    const scaleY = vHeight / imageNaturalHeight.value;
    const calculatedFit = Math.min(scaleX, scaleY, 1);
    fitScale.value = Math.max(0.1, Number(calculatedFit.toFixed(3)));
    scale.value = fitScale.value;
    translateX.value = 0;
    translateY.value = 0;
  }
};

/**
 * 鼠标滚轮缩放
 */
const handleWheel = (e: WheelEvent) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.08 : -0.08;
  const nextScale = Number((scale.value + delta).toFixed(2));
  scale.value = Math.min(Math.max(0.1, nextScale), 3.0);
};

/**
 * 鼠标拖拽平移
 */
const handleMouseDown = (e: MouseEvent) => {
  if (e.button !== 0) return; // 仅限左键
  isDragging.value = true;
  dragStartX.value = e.clientX;
  dragStartY.value = e.clientY;
  initialTranslateX.value = translateX.value;
  initialTranslateY.value = translateY.value;
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return;
  const deltaX = e.clientX - dragStartX.value;
  const deltaY = e.clientY - dragStartY.value;
  translateX.value = initialTranslateX.value + deltaX;
  translateY.value = initialTranslateY.value + deltaY;
};

const handleMouseUp = () => {
  isDragging.value = false;
};

// 缩放快捷方法
const zoomIn = () => {
  scale.value = Math.min(3.0, Number((scale.value + 0.1).toFixed(2)));
};
const zoomOut = () => {
  scale.value = Math.max(0.1, Number((scale.value - 0.1).toFixed(2)));
};
const setOriginalSize = () => {
  scale.value = 1;
  translateX.value = 0;
  translateY.value = 0;
};

// 复制图片到剪贴板（直接消费已渲染的 Blob，秒级完成）
const handleCopy = async () => {
  if (!previewBlob.value) {
    alert('图片正在渲染中，请稍候...');
    return;
  }
  try {
    isCopying.value = true;
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': previewBlob.value,
      }),
    ]);
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);
  } catch (err) {
    console.error('[QuickShare] 复制失败:', err);
    alert('复制到剪切板失败，请尝试直接下载 PNG');
  } finally {
    isCopying.value = false;
  }
};

// 下载 PNG（直接消费已生成的 DataURL/Blob，秒级完成）
const handleDownload = async () => {
  if (!previewDataUrl.value) {
    alert('图片正在渲染中，请稍候...');
    return;
  }
  try {
    isDownloading.value = true;
    const link = document.createElement('a');
    link.download = `quick-share-${props.post.platform}-${Date.now()}.png`;
    link.href = previewDataUrl.value;
    link.click();
  } catch (err) {
    console.error('[QuickShare] 下载失败:', err);
    alert('下载图片失败');
  } finally {
    isDownloading.value = false;
  }
};

const selectTheme = (themeId: CardThemeId) => {
  options.themeId = themeId;
};

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  triggerRender();
  if (viewportRef.value) {
    resizeObserver = new ResizeObserver(() => {
      resetToFit();
    });
    resizeObserver.observe(viewportRef.value);
  }
  window.addEventListener('mouseup', handleMouseUp);
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  window.removeEventListener('mouseup', handleMouseUp);
  if (renderTimer) clearTimeout(renderTimer);
});

// 监听配置项变化重新渲染离屏图片
watch(
  [
    () => options.themeId,
    () => options.padding,
    () => options.fontScale,
    () => options.showQrCode,
    () => options.showWatermark,
    () => props.post,
  ],
  () => {
    triggerRender();
  }
);
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-opacity text-slate-800 font-sans"
    @click.self="emit('close')"
  >
    <!-- ================= 离屏未缩放真实渲染源 (绝对不会受任何 transform 裁剪) ================= -->
    <div
      class="fixed -left-[9999px] top-0 pointer-events-none opacity-100 z-[-1]"
      aria-hidden="true"
    >
      <div ref="offscreenCardRef" class="w-[620px]">
        <ShareCard
          :post="post"
          :options="options"
        />
      </div>
    </div>

    <!-- ================= 模态框主体 ================= -->
    <div
      class="bg-white rounded-2xl shadow-2xl flex flex-col h-[92vh] w-full max-w-6xl overflow-hidden border border-slate-100"
    >
      <!-- Header -->
      <div class="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
        <div class="flex items-center gap-2.5">
          <div class="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
            <Sparkles class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-base font-bold text-slate-900 leading-none">生成分享卡片</h2>
            <p class="text-xs text-slate-400 mt-1">从 {{ post.platform.toUpperCase() }} 提取完整内容并高清渲染</p>
          </div>
        </div>

        <button
          @click="emit('close')"
          class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Main Body: 左右分栏 -->
      <div class="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50 min-h-0">
        <!-- 左侧：参数调整控制台 -->
        <div class="w-full md:w-80 border-r border-slate-200/80 p-5 overflow-y-auto space-y-6 bg-white shrink-0">
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
                class="p-2.5 text-left rounded-xl border text-xs font-medium transition-all flex flex-col gap-1.5 cursor-pointer"
                :class="[
                  options.themeId === theme.id
                    ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/30 font-bold text-sky-900'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                ]"
              >
                <div class="h-4 w-full rounded-md shadow-inner" :class="theme.backgroundClass" />
                <span class="truncate">{{ theme.name }}</span>
              </button>
            </div>
          </div>

          <!-- 2. 布局与间距 -->
          <div class="space-y-3 pt-2 border-t border-slate-100">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Layout class="w-3.5 h-3.5" />
              外层边距
            </label>
            <div class="grid grid-cols-4 gap-1.5">
              <button
                v-for="pad in [16, 24, 32, 48]"
                :key="pad"
                @click="options.padding = pad"
                class="py-1.5 px-2 text-xs rounded-lg border text-center font-medium transition-colors cursor-pointer"
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
              文字缩放
            </label>
            <div class="grid grid-cols-4 gap-1.5">
              <button
                v-for="scaleItem in [0.9, 1.0, 1.1, 1.2]"
                :key="scaleItem"
                @click="options.fontScale = scaleItem"
                class="py-1.5 px-2 text-xs rounded-lg border text-center font-medium transition-colors cursor-pointer"
                :class="[
                  options.fontScale === scaleItem
                    ? 'border-sky-500 bg-sky-50 text-sky-600 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                ]"
              >
                {{ scaleItem }}x
              </button>
            </div>
          </div>

          <!-- 4. 开关项 -->
          <div class="space-y-3 pt-2 border-t border-slate-100">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders class="w-3.5 h-3.5" />
              元素显示
            </label>
            <div class="space-y-2.5">
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

        <!-- 右侧：纯图片交互画布区（支持拖拽平移、滚轮缩放、自适应一屏完整呈现） -->
        <div
          ref="viewportRef"
          class="flex-1 relative overflow-hidden bg-slate-900/5 select-none flex items-center justify-center min-h-0"
          :class="isDragging ? 'cursor-grabbing' : 'cursor-grab'"
          @wheel.prevent="handleWheel"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
        >
          <!-- 悬浮控制工具栏 -->
          <div class="absolute top-4 right-4 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-md shadow-lg border border-slate-200/80 rounded-xl p-1 text-xs">
            <button
              @click.stop="zoomOut"
              class="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
              title="缩小 (或向下滚轮)"
            >
              <ZoomOut class="w-4 h-4" />
            </button>
            <span class="px-2 font-mono text-slate-600 text-[11px] min-w-12 text-center">
              {{ Math.round(scale * 100) }}%
            </span>
            <button
              @click.stop="zoomIn"
              class="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
              title="放大 (或向上滚轮)"
            >
              <ZoomIn class="w-4 h-4" />
            </button>
            <div class="w-[1px] h-3 bg-slate-200 mx-1" />
            <button
              @click.stop="resetToFit"
              class="px-2.5 py-1 hover:bg-sky-50 hover:text-sky-600 text-slate-700 rounded-lg transition-colors font-medium flex items-center gap-1 cursor-pointer"
              title="自适应居中"
            >
              <Maximize2 class="w-3.5 h-3.5" />
              自适应
            </button>
            <button
              @click.stop="setOriginalSize"
              class="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
              title="100% 原始大小"
            >
              <RotateCcw class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- 拖拽提示 Badge -->
          <div class="absolute bottom-4 left-4 z-20 pointer-events-none px-2.5 py-1 bg-black/40 backdrop-blur-md rounded-lg text-white text-[11px] flex items-center gap-1.5 opacity-80">
            <Move class="w-3 h-3" />
            按住左键拖拽平移 • 滚轮缩放
          </div>

          <!-- Loading 状态浮层 -->
          <div
            v-if="isRendering && !previewDataUrl"
            class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm text-slate-600 gap-2"
          >
            <Loader2 class="w-8 h-8 animate-spin text-sky-600" />
            <span class="text-xs font-medium">正在生成高清卡片图片...</span>
          </div>

          <!-- 纯图片渲染展示层 -->
          <div
            v-if="previewDataUrl"
            class="transition-transform duration-75 ease-out shrink-0"
            :style="{
              transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
              transformOrigin: 'center center',
            }"
          >
            <img
              :src="previewDataUrl"
              alt="Card Preview"
              class="shadow-2xl rounded-2xl pointer-events-none max-w-none block"
              :style="{
                width: `${imageNaturalWidth}px`,
                height: `${imageNaturalHeight}px`,
              }"
            />
          </div>
        </div>
      </div>

      <!-- Footer: 操作栏 -->
      <div class="px-6 py-3.5 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
        <span class="text-xs text-slate-400">
          已就绪 • 导出将生成 2x Retina 级高分辨率完整长图
        </span>

        <div class="flex items-center gap-3">
          <button
            @click="handleCopy"
            :disabled="isCopying || isRendering"
            class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Check v-if="copySuccess" class="w-4 h-4 text-emerald-500" />
            <Loader2 v-else-if="isCopying" class="w-4 h-4 animate-spin text-slate-500" />
            <Copy v-else class="w-4 h-4" />
            <span>{{ copySuccess ? '已复制到剪切板' : isCopying ? '正在复制...' : '复制图片' }}</span>
          </button>

          <button
            @click="handleDownload"
            :disabled="isDownloading || isRendering"
            class="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-sm font-semibold shadow-md shadow-sky-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Loader2 v-if="isDownloading" class="w-4 h-4 animate-spin" />
            <Download v-else class="w-4 h-4" />
            <span>{{ isDownloading ? '正在保存...' : '下载 PNG' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
