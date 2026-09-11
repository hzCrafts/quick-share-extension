<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import type { PostData } from '@/types/post';
import { type CardRenderOptions, type CardThemeId, type QuickShareTheme, BUILTIN_THEMES } from '@/types/theme';
import { 
  getThemeById, 
  loadCustomThemes, 
  saveCustomTheme, 
  deleteCustomTheme, 
  exportThemeToJson, 
  importThemeFromJson 
} from '@/utils/theme-engine';
import ShareCard from '@/components/card/ShareCard.vue';
import { renderCardToCanvas, copyCardToClipboard, downloadCardAsPng } from '@/utils/exporter';
import { 
  getLastCardTheme, 
  setLastCardTheme, 
  getLastShowOuterPadding, 
  setLastShowOuterPadding,
  getSidebarCollapsed,
  setSidebarCollapsed
} from '@/utils/storage';
import { 
  X, 
  Copy, 
  Download, 
  Check, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Loader2, 
  ArrowLeftRight, 
  Link2,
  Upload,
  Share2,
  Trash2,
  Code2,
  Image as ImageIcon,
  Terminal,
  FileCode,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    post: PostData | null;
    visible: boolean;
    isExtracting?: boolean;
    initialSidebarCollapsed?: boolean;
  }>(),
  {
    isExtracting: false,
    initialSidebarCollapsed: undefined,
  }
);

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const isAiPlatform = computed(() => props.post?.platform === 'chatgpt' || props.post?.platform === 'gemini');
const platformName = computed(() => props.post?.platform ? props.post.platform.toUpperCase() : '网页');

// 视图模式：'image' (默认 2.5x 离屏渲染图片) | 'dom' (真实 DOM 调试模式)
const viewMode = ref<'image' | 'dom'>('image');
const copyHtmlSuccess = ref(false);
const logConsoleSuccess = ref(false);

// 侧边栏折叠状态与动画控制（初次挂载静默无动画，仅在用户交互时激活动画）
const isSidebarCollapsed = ref(props.initialSidebarCollapsed ?? false);
const isSidebarAnimated = ref(false);

// 离屏渲染与视口引用
const offscreenCardRef = ref<HTMLElement | null>(null);
const viewportRef = ref<HTMLElement | null>(null);

// 自定义主题与主题列表
const customThemes = ref<QuickShareTheme[]>([]);
const allThemes = computed<QuickShareTheme[]>(() => {
  return [...Object.values(BUILTIN_THEMES), ...customThemes.value];
});

// 卡片渲染配置
const options = reactive<CardRenderOptions>({
  themeId: 'raycast-dark',
  showOuterPadding: true,
  padding: 24,
  showQrCode: false,
  showWatermark: true,
  showStats: false,
  fontScale: 1.0,
  cardRadius: 16,
  authorAvatarRadius: 'rounded-full',
  aspectRatio: 'auto',
});

// 主题导入/导出弹窗状态
const isImportModalOpen = ref(false);
const importJsonInput = ref('');
const importError = ref('');
const copyThemeSuccess = ref(false);

// 生成的高清预览图片
const previewDataUrl = ref<string>('');
const previewBlob = ref<Blob | null>(null);
const imageNaturalWidth = ref<number>(0);
const imageNaturalHeight = ref<number>(0);
const isRendering = ref<boolean>(false);

// 缩放与平移状态 (支持 0.01x 极小全景缩放 ~ 4.0x 高清局部放大)
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
const copyUrlSuccess = ref(false);

/**
 * 触发离屏真实 DOM 高清预览渲染 (2.5x Retina 超高清输出)
 */
let renderTimer: any = null;
const previewScale = 2.5;

const triggerRender = () => {
  if (renderTimer) clearTimeout(renderTimer);
  if (!props.post) return;
  isRendering.value = true;
  renderTimer = setTimeout(async () => {
    if (!offscreenCardRef.value) return;
    try {
      await nextTick();
      // 让出事件循环主线程，确保 Loading 动画即时平滑绘制
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 16)));

      const canvas = await renderCardToCanvas(offscreenCardRef.value, {
        scale: previewScale,
        cardRadius: options.cardRadius,
      });

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png', 0.95);
      });

      if (blob) {
        if (previewDataUrl.value) {
          URL.revokeObjectURL(previewDataUrl.value);
        }
        previewBlob.value = blob;
        const url = URL.createObjectURL(blob);
        
        // 优先使用非阻塞异步解码 API (createImageBitmap)，避免主线程卡顿
        try {
          const bitmap = await createImageBitmap(blob);
          imageNaturalWidth.value = bitmap.width / previewScale;
          imageNaturalHeight.value = bitmap.height / previewScale;
          bitmap.close();
        } catch {
          const img = new Image();
          await new Promise<void>((resolve) => {
            img.onload = () => {
              imageNaturalWidth.value = img.naturalWidth / previewScale;
              imageNaturalHeight.value = img.naturalHeight / previewScale;
              resolve();
            };
            img.src = url;
          });
        }

        previewDataUrl.value = url;
        isRendering.value = false;
        nextTick(resetToFit);
      }
    } catch (err) {
      console.error('[QuickShare] Render failed:', err);
      isRendering.value = false;
    }
  }, 40);
};

/**
 * 全图自适应（无论多长的长图，彻底解除最小缩放限制，100% 完整显示整张长图）
 */
const resetToFit = () => {
  if (!viewportRef.value || !imageNaturalWidth.value || !imageNaturalHeight.value) return;
  const vWidth = viewportRef.value.clientWidth - 40;
  const vHeight = viewportRef.value.clientHeight - 40;

  if (vWidth > 0 && vHeight > 0) {
    const scaleX = vWidth / imageNaturalWidth.value;
    const scaleY = vHeight / imageNaturalHeight.value;
    const calculatedFit = Math.min(scaleX, scaleY, 1);
    fitScale.value = Math.max(0.01, Number(calculatedFit.toFixed(4)));
    scale.value = fitScale.value;
    translateX.value = 0;
    translateY.value = 0;
  }
};

/**
 * 宽度自适应（缩放到 100% 容器宽度，便于上下滚动长图）
 */
const fitToWidth = () => {
  if (!viewportRef.value || !imageNaturalWidth.value || !imageNaturalHeight.value) return;
  const vWidth = viewportRef.value.clientWidth - 40;
  const vHeight = viewportRef.value.clientHeight - 40;
  if (vWidth > 0 && imageNaturalWidth.value > 0) {
    const scaleW = Number((vWidth / imageNaturalWidth.value).toFixed(3));
    scale.value = Math.min(Math.max(0.01, scaleW), 3.5);
    translateX.value = 0;
    const scaledHeight = imageNaturalHeight.value * scale.value;
    if (scaledHeight > vHeight) {
      translateY.value = (scaledHeight - vHeight) / 2;
    } else {
      translateY.value = 0;
    }
  }
};

/**
 * 复合滚轮事件处理：
 * - Meta (Command) 或 Ctrl + 滚轮：光标锚定缩放
 * - Shift + 滚轮：左右横向平移
 * - 普通滚轮：上下平移
 */
const handleWheel = (e: WheelEvent) => {
  e.preventDefault();
  if (!viewportRef.value) return;

  // 1. Meta / Ctrl + 滚轮 -> 缩放
  if (e.metaKey || e.ctrlKey) {
    const rect = viewportRef.value.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const mx = mouseX - rect.width / 2;
    const my = mouseY - rect.height / 2;

    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    const oldScale = scale.value;
    const newScale = Math.min(Math.max(0.01, Number((oldScale + delta).toFixed(3))), 4.0);

    if (newScale === oldScale) return;

    const ratio = newScale / oldScale;
    translateX.value = mx - (mx - translateX.value) * ratio;
    translateY.value = my - (my - translateY.value) * ratio;
    scale.value = newScale;
    return;
  }

  // 2. Shift + 滚轮 -> 左右平移
  if (e.shiftKey) {
    const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
    translateX.value -= delta * 1.2;
    return;
  }

  // 3. 普通滚轮 -> 上下平移
  translateY.value -= e.deltaY * 1.2;
};

/**
 * 鼠标拖拽平移交互
 */
const handleMouseDown = (e: MouseEvent) => {
  if (e.button !== 0) return;
  e.preventDefault();
  isDragging.value = true;
  dragStartX.value = e.clientX;
  dragStartY.value = e.clientY;
  initialTranslateX.value = translateX.value;
  initialTranslateY.value = translateY.value;
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return;
  e.preventDefault();
  const deltaX = e.clientX - dragStartX.value;
  const deltaY = e.clientY - dragStartY.value;
  translateX.value = initialTranslateX.value + deltaX;
  translateY.value = initialTranslateY.value + deltaY;
};

const handleMouseUp = () => {
  isDragging.value = false;
};

// 缩放辅助
const zoomIn = () => {
  scale.value = Math.min(4.0, Number((scale.value + 0.15).toFixed(2)));
};
const zoomOut = () => {
  scale.value = Math.max(0.01, Number((scale.value - 0.15).toFixed(2)));
};
const setOriginalSize = () => {
  scale.value = 1;
  translateX.value = 0;
  translateY.value = 0;
};

// 复制链接
const handleCopyUrl = async () => {
  if (!props.post?.url) return;
  try {
    await navigator.clipboard.writeText(props.post.url);
    copyUrlSuccess.value = true;
    setTimeout(() => {
      copyUrlSuccess.value = false;
    }, 2000);
  } catch (err) {
    console.error('[QuickShare] 复制链接失败:', err);
  }
};

// 复制 2.5x 高清图片到剪切板
const handleCopy = async () => {
  if (!offscreenCardRef.value) return;
  try {
    isCopying.value = true;
    await copyCardToClipboard(offscreenCardRef.value, {
      scale: 2.5,
      quality: 0.98,
      cardRadius: options.cardRadius,
    });
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);
  } catch (err) {
    console.error('[QuickShare] 复制失败:', err);
    alert('复制图片到剪切板失败，请尝试直接下载 PNG');
  } finally {
    isCopying.value = false;
  }
};

// 下载 2.5x 高清 PNG 图片
const handleDownload = async () => {
  if (!offscreenCardRef.value) return;
  try {
    isDownloading.value = true;
    const platform = props.post?.platform || 'share';
    await downloadCardAsPng(
      offscreenCardRef.value,
      `quick-share-${platform}-${Date.now()}.png`,
      { scale: 2.5, quality: 0.98, cardRadius: options.cardRadius }
    );
  } catch (err) {
    console.error('[QuickShare] 下载失败:', err);
    alert('下载图片失败');
  } finally {
    isDownloading.value = false;
  }
};

const selectTheme = (themeId: CardThemeId) => {
  options.themeId = themeId;
  setLastCardTheme(themeId);
};

const toggleOuterPadding = () => {
  options.showOuterPadding = !options.showOuterPadding;
  setLastShowOuterPadding(options.showOuterPadding);
};

const toggleSidebar = () => {
  isSidebarAnimated.value = true;
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
  setSidebarCollapsed(isSidebarCollapsed.value);
};

// 导出当前主题 JSON
const handleExportCurrentTheme = async () => {
  const current = getThemeById(options.themeId, customThemes.value);
  const jsonStr = exportThemeToJson(current);
  try {
    await navigator.clipboard.writeText(jsonStr);
    copyThemeSuccess.value = true;
    setTimeout(() => {
      copyThemeSuccess.value = false;
    }, 2000);
  } catch {
    alert('复制主题 JSON 到剪切板失败');
  }
};

// 导入主题处理
const handleConfirmImport = async () => {
  if (!importJsonInput.value.trim()) {
    importError.value = '请输入或粘贴主题 JSON 内容';
    return;
  }
  const res = importThemeFromJson(importJsonInput.value);
  if (!res.success || !res.theme) {
    importError.value = res.error || '主题导入失败，请检查格式';
    return;
  }
  await saveCustomTheme(res.theme);
  customThemes.value = await loadCustomThemes();
  options.themeId = res.theme.id;
  setLastCardTheme(res.theme.id);
  isImportModalOpen.value = false;
  importJsonInput.value = '';
  importError.value = '';
};

// 删除自定义主题
const handleDeleteTheme = async (themeId: string) => {
  await deleteCustomTheme(themeId);
  customThemes.value = await loadCustomThemes();
  if (options.themeId === themeId) {
    options.themeId = 'raycast-dark';
    setLastCardTheme('raycast-dark');
  }
};

// 复制解析后的富文本 HTML（用于对比原网站 DOM）
const handleCopyHtml = async () => {
  if (!props.post?.contentHtml && !props.post?.content) return;
  try {
    await navigator.clipboard.writeText(props.post.contentHtml || props.post.content);
    copyHtmlSuccess.value = true;
    setTimeout(() => {
      copyHtmlSuccess.value = false;
    }, 2000);
  } catch (err) {
    console.error('[QuickShare] 复制 HTML 失败:', err);
  }
};

// 在控制台格式化打印 PostData 并挂载全局变量
const handleLogToConsole = () => {
  if (!props.post) return;
  console.group('🔍 [QuickShare Debug] PostData 解析结构详情');
  console.log('Platform:', props.post.platform);
  console.log('Title:', props.post.title);
  console.log('Author:', props.post.author);
  console.log('URL:', props.post.url);
  console.log('Is Excerpt:', props.post.isExcerpt);
  console.log('Content (纯文本):\n', props.post.content);
  console.log('ContentHtml (富文本):\n', props.post.contentHtml);
  console.log('完整对象:', props.post);
  console.log('💡 全局变量已挂载: window.__QUICK_SHARE_POST__');
  console.groupEnd();

  if (typeof window !== 'undefined') {
    (window as any).__QUICK_SHARE_POST__ = props.post;
  }

  logConsoleSuccess.value = true;
  setTimeout(() => {
    logConsoleSuccess.value = false;
  }, 2000);
};

// 快捷键切换调试模式 (Alt + D 或 Cmd/Ctrl + Shift + D)
const handleKeyDown = (e: KeyboardEvent) => {
  if ((e.altKey && (e.key === 'd' || e.key === 'D')) || ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'd' || e.key === 'D'))) {
    e.preventDefault();
    viewMode.value = viewMode.value === 'image' ? 'dom' : 'image';
    if (viewMode.value === 'dom') {
      handleLogToConsole();
    }
  }
};

let resizeObserver: ResizeObserver | null = null;

onMounted(async () => {
  // 加载自定义主题与恢复上次选中的卡片主题/外层背景边距/侧边栏折叠状态
  const [loadedCustoms, savedTheme, savedOuterPadding, savedSidebarCollapsed] = await Promise.all([
    loadCustomThemes(),
    getLastCardTheme(),
    getLastShowOuterPadding(),
    getSidebarCollapsed(),
  ]);
  customThemes.value = loadedCustoms;

  if (savedTheme) {
    const resolved = getThemeById(savedTheme, loadedCustoms);
    options.themeId = resolved.id;
  } else {
    options.themeId = 'raycast-dark';
  }
  options.showOuterPadding = savedOuterPadding;
  isSidebarCollapsed.value = savedSidebarCollapsed;

  // 初始静默渲染完成后，在下一个动画帧开启平滑过渡，防止初次打开弹窗触发收起/展开动画
  await nextTick();
  requestAnimationFrame(() => {
    isSidebarAnimated.value = true;
  });

  if (props.post) {
    if (typeof window !== 'undefined') {
      (window as any).__QUICK_SHARE_POST__ = props.post;
    }
    triggerRender();
  }
  if (viewportRef.value) {
    resizeObserver = new ResizeObserver(() => {
      resetToFit();
    });
    resizeObserver.observe(viewportRef.value);
  }
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);
  window.removeEventListener('keydown', handleKeyDown);
  if (renderTimer) clearTimeout(renderTimer);
  if (previewDataUrl.value) {
    URL.revokeObjectURL(previewDataUrl.value);
  }
});

watch(
  () => props.visible,
  async (newVal) => {
    if (newVal) {
      isSidebarAnimated.value = false;
      const [loadedCustoms, savedTheme, savedOuterPadding, savedSidebarCollapsed] = await Promise.all([
        loadCustomThemes(),
        getLastCardTheme(),
        getLastShowOuterPadding(),
        getSidebarCollapsed(),
      ]);
      customThemes.value = loadedCustoms;
      if (savedTheme) {
        const resolved = getThemeById(savedTheme, loadedCustoms);
        options.themeId = resolved.id;
      }
      options.showOuterPadding = savedOuterPadding;
      isSidebarCollapsed.value = savedSidebarCollapsed;

      await nextTick();
      requestAnimationFrame(() => {
        isSidebarAnimated.value = true;
      });
    }
  }
);

watch(
  [
    () => options.themeId,
    () => options.showOuterPadding,
    () => options.padding,
    () => options.fontScale,
    () => options.showWatermark,
    () => props.post,
  ],
  () => {
    if (props.post) {
      triggerRender();
    }
  }
);
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 sm:p-6 bg-black/70 dark:bg-black/85 backdrop-blur-sm transition-opacity text-zinc-900 dark:text-zinc-100 font-sans pointer-events-auto select-none"
    @click.self="emit('close')"
  >
    <!-- 离屏真实未缩放渲染源 (固定标准 720px 物理排版宽度) -->
    <div
      v-if="post"
      class="fixed -left-[9999px] top-0 pointer-events-none opacity-100 z-[-1] bg-transparent"
      style="background: transparent !important;"
      aria-hidden="true"
    >
      <div ref="offscreenCardRef" class="w-[720px] max-w-[720px] bg-transparent" style="background: transparent !important;">
        <ShareCard
          :post="post"
          :options="options"
          :custom-themes="customThemes"
        />
      </div>
    </div>

    <!-- 模态框主体 (Raycast 风格，纯黑白两套，rounded-3xl 大圆角) -->
    <div
      class="bg-white dark:bg-[#18181b] rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.28)] dark:shadow-[0_30px_90px_rgba(0,0,0,0.7)] flex flex-col h-[90vh] w-full max-w-6xl overflow-hidden border border-zinc-200/80 dark:border-white/10 transition-colors"
    >
      <!-- Header: 极简纯净，去 AI 味 -->
      <div class="px-6 py-3 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between shrink-0 bg-white dark:bg-[#18181b]">
        <div class="flex items-center gap-2.5">
          <button
            type="button"
            @click="toggleSidebar"
            class="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            :title="isSidebarCollapsed ? '展开侧边栏 (卡片主题与配置)' : '收起侧边栏'"
          >
            <PanelLeftOpen v-if="isSidebarCollapsed" class="w-4 h-4" />
            <PanelLeftClose v-else class="w-4 h-4" />
          </button>
          <div class="w-[1px] h-3.5 bg-zinc-200 dark:bg-zinc-700" />
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">QuickShare</span>
            <span class="text-xs text-zinc-300 dark:text-zinc-700">/</span>
            <span class="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{{ platformName }}</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <!-- 模式切换：预览图 vs 真实 DOM (调试) -->
          <div class="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-xl border border-zinc-200/60 dark:border-white/5 text-xs">
            <button
              type="button"
              @click="viewMode = 'image'"
              class="px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer select-none"
              :class="viewMode === 'image' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-semibold' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'"
            >
              <ImageIcon class="w-3.5 h-3.5" />
              <span>预览图</span>
            </button>
            <button
              type="button"
              @click="viewMode = 'dom'; handleLogToConsole();"
              class="px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer select-none"
              :class="viewMode === 'dom' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-semibold' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'"
              title="切换到真实 DOM 结构（方便使用 DevTools 审查元素与排查 DOM 结构）[快捷键: Alt+D]"
            >
              <Code2 class="w-3.5 h-3.5" />
              <span>真实 DOM</span>
            </button>
          </div>

          <button
            @click="emit('close')"
            class="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Main Body: 永久左右分栏 -->
      <div class="flex-1 flex flex-row overflow-hidden bg-zinc-50/50 dark:bg-[#121214] min-h-0">
        <!-- 左侧：精简单列主题控制台 (固定宽度 w-52，支持收起/展开) -->
        <div
          class="bg-white dark:bg-[#18181b] shrink-0"
          :class="[
            isSidebarAnimated ? 'transition-all duration-200 ease-in-out' : '',
            isSidebarCollapsed
              ? 'w-0 p-0 border-r-0 opacity-0 pointer-events-none overflow-hidden'
              : 'w-52 border-r border-zinc-200/70 dark:border-white/10 p-3.5 opacity-100 overflow-y-auto space-y-4'
          ]"
        >
          <!-- 1. 主题选择 -->
          <div class="space-y-2">
            <div class="flex items-center justify-between px-1">
              <label class="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                卡片主题
              </label>
              <!-- 导出/导入/收起主题入口 -->
              <div class="flex items-center gap-0.5">
                <button
                  @click="handleExportCurrentTheme"
                  class="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  :title="copyThemeSuccess ? '已复制主题 JSON' : '导出/复制当前主题 JSON'"
                >
                  <Check v-if="copyThemeSuccess" class="w-3.5 h-3.5 text-emerald-500" />
                  <Share2 v-else class="w-3.5 h-3.5" />
                </button>
                <button
                  @click="isImportModalOpen = true"
                  class="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="导入自定义主题 (JSON)"
                >
                  <Upload class="w-3.5 h-3.5" />
                </button>
                <button
                  @click="toggleSidebar"
                  class="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="收起侧边栏"
                >
                  <PanelLeftClose class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- 主题卡片单列列表 -->
            <div class="flex flex-col gap-1.5">
              <div
                v-for="theme in allThemes"
                :key="theme.id"
                class="group relative"
              >
                <button
                  @click="selectTheme(theme.id)"
                  class="w-full p-2 rounded-xl border text-xs font-medium transition-all flex flex-col gap-1.5 cursor-pointer text-left relative overflow-hidden focus:outline-none"
                  :class="[
                    options.themeId === theme.id
                      ? 'border-zinc-900 dark:border-white/40 bg-zinc-900/5 dark:bg-white/10 text-zinc-950 dark:text-white font-semibold ring-1 ring-zinc-900/10 dark:ring-white/20 shadow-sm'
                      : 'border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900/40 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/60'
                  ]"
                >
                  <!-- Mini Card Skeleton Preview -->
                  <div
                    class="w-full h-8 rounded-lg overflow-hidden p-1.5 flex flex-col justify-between shadow-xs relative transition-transform group-hover:scale-[1.01]"
                    :style="{
                      background: theme.previewColor || theme.card.background,
                      color: theme.typography.textPrimary
                    }"
                  >
                    <!-- Top mini row -->
                    <div class="flex items-center gap-1">
                      <div class="w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0" />
                      <div class="w-8 h-1 rounded-full bg-current opacity-40" />
                    </div>
                    <!-- Bottom mini row -->
                    <div class="w-12 h-1 rounded-full bg-current opacity-30" />
                  </div>

                  <!-- Theme Name -->
                  <div class="flex items-center justify-between gap-1 w-full px-0.5">
                    <span class="truncate text-[11px] leading-tight">{{ theme.name }}</span>
                    <span
                      v-if="options.themeId === theme.id"
                      class="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-white shrink-0"
                    />
                  </div>
                </button>

                <!-- 自定义主题删除按钮 -->
                <button
                  v-if="theme.id.startsWith('custom-')"
                  @click.stop="handleDeleteTheme(theme.id)"
                  class="absolute top-1.5 right-1.5 p-1 bg-red-500/80 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer shadow-sm"
                  title="删除此自定义主题"
                >
                  <Trash2 class="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </div>

          <!-- 2. 卡片配置 (外层背景边距开关) -->
          <div class="space-y-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
            <label class="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1">
              卡片布局
            </label>
            <div class="flex flex-col gap-1.5">
              <button
                type="button"
                @click="toggleOuterPadding"
                class="w-full flex items-center justify-between p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer select-none text-left focus:outline-none"
                :class="[
                  options.showOuterPadding
                    ? 'border-zinc-900/30 dark:border-white/20 bg-zinc-900/5 dark:bg-white/5 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'border-zinc-200/80 dark:border-zinc-800/80 text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900/40 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/60'
                ]"
              >
                <span class="font-medium leading-tight">背景衬底边距</span>
                <!-- Switch Pill (标准 macOS / Raycast 纯白滑块与平滑滑道) -->
                <div
                  class="w-8 h-4.5 rounded-full transition-colors relative flex items-center p-0.5 shrink-0"
                  :class="options.showOuterPadding ? 'bg-zinc-900 dark:bg-zinc-600' : 'bg-zinc-200 dark:bg-zinc-800 border border-zinc-300/60 dark:border-zinc-700/60'"
                >
                  <div
                    class="w-3.5 h-3.5 rounded-full bg-white shadow-xs transition-transform duration-150"
                    :class="options.showOuterPadding ? 'translate-x-3.5' : 'translate-x-0'"
                  />
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- 右侧：视口渲染区 (支持 2.5x 高清图片预览模式 与 活体 DOM 审查调试模式) -->
        <div
          ref="viewportRef"
          class="flex-1 min-w-0 relative overflow-hidden bg-zinc-100/60 dark:bg-[#0e0e10] flex items-center justify-center min-h-0"
          :class="viewMode === 'dom' ? 'select-text' : 'select-none'"
        >
          <!-- 1. 全屏透明交互捕获层 (仅在图片预览模式下启用拖拽平移与滚轮缩放) -->
          <div
            v-if="viewMode === 'image'"
            class="absolute inset-0 z-10 select-none"
            :class="isDragging ? 'cursor-grabbing' : 'cursor-grab'"
            :style="{ cursor: isDragging ? 'grabbing' : 'grab' }"
            @wheel.prevent="handleWheel"
            @mousedown="handleMouseDown"
          />

          <!-- 2. 悬浮控制工具栏 (Raycast 极简小岛) -->
          <div class="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-white/80 hover:bg-white/95 dark:bg-zinc-900/80 dark:hover:bg-zinc-900/95 backdrop-blur-md shadow-sm hover:shadow-md border border-zinc-200/80 dark:border-white/10 rounded-xl p-1 text-xs opacity-70 hover:opacity-100 transition-all duration-200">
            <!-- DOM 模式专属快捷辅助按钮 -->
            <template v-if="viewMode === 'dom'">
              <button
                @click.stop="handleCopyHtml"
                class="px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                :title="copyHtmlSuccess ? '已复制 contentHtml' : '复制解析后的 contentHtml 到剪切板'"
              >
                <Check v-if="copyHtmlSuccess" class="w-3.5 h-3.5 text-emerald-500" />
                <FileCode v-else class="w-3.5 h-3.5" />
                <span class="text-[11px]">{{ copyHtmlSuccess ? '已复制' : '复制 HTML' }}</span>
              </button>

              <button
                @click.stop="handleLogToConsole"
                class="px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                title="在控制台打印 PostData 结构 (window.__QUICK_SHARE_POST__)"
              >
                <Check v-if="logConsoleSuccess" class="w-3.5 h-3.5 text-emerald-500" />
                <Terminal v-else class="w-3.5 h-3.5" />
                <span class="text-[11px]">{{ logConsoleSuccess ? '已打印' : '控制台打印' }}</span>
              </button>

              <div class="w-[1px] h-3.5 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />
            </template>

            <!-- 缩放控制 -->
            <button
              @click.stop="zoomOut"
              class="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              title="缩小 (或 Meta+向下滚轮)"
            >
              <ZoomOut class="w-4 h-4" />
            </button>
            <span class="px-1.5 font-mono text-zinc-600 dark:text-zinc-400 text-[11px] min-w-10 text-center">
              {{ Math.round(scale * 100) }}%
            </span>
            <button
              @click.stop="zoomIn"
              class="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              title="放大 (或 Meta+向上滚轮)"
            >
              <ZoomIn class="w-4 h-4" />
            </button>

            <!-- Image 模式专属全屏/宽度自适应 -->
            <template v-if="viewMode === 'image'">
              <div class="w-[1px] h-3.5 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />
              <!-- 宽度自适应 -->
              <button
                @click.stop="fitToWidth"
                class="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                title="宽度自适应 (100% 宽度适配)"
              >
                <ArrowLeftRight class="w-4 h-4" />
              </button>

              <!-- 全图自适应 -->
              <button
                @click.stop="resetToFit"
                class="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                title="全图自适应 (整张完整可见)"
              >
                <Maximize2 class="w-4 h-4" />
              </button>
            </template>

            <!-- 100% 原始大小 -->
            <button
              @click.stop="setOriginalSize"
              class="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              title="100% 原始比例"
            >
              <RotateCcw class="w-4 h-4" />
            </button>
          </div>

          <!-- 3. Loading 状态 -->
          <div
            v-if="(!post || isExtracting || isRendering) && !previewDataUrl && viewMode === 'image'"
            class="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/70 dark:bg-zinc-900/80 backdrop-blur-sm text-zinc-800 dark:text-zinc-200 gap-2.5 transition-opacity pointer-events-none"
          >
            <Loader2 class="w-7 h-7 animate-spin text-zinc-900 dark:text-white will-change-transform" />
            <span class="text-xs font-medium tracking-wide text-zinc-600 dark:text-zinc-400">
              {{ !post || isExtracting ? '正在解析内容与高清资源...' : '正在生成高清卡片...' }}
            </span>
          </div>

          <!-- 4.1 DOM 真实结构调试渲染层 (Live DOM 模式，文本可划选，允许使用 DevTools Inspect 审查) -->
          <div
            v-if="viewMode === 'dom' && post"
            class="w-full h-full overflow-y-auto overflow-x-hidden p-6 sm:p-10 flex justify-center items-start select-text cursor-auto z-0"
          >
            <div
              class="w-[720px] max-w-[720px] shrink-0 shadow-2xl transition-transform my-auto pointer-events-auto"
              :style="{
                transform: scale !== 1 ? `scale(${scale})` : undefined,
                transformOrigin: 'top center',
              }"
            >
              <ShareCard
                :post="post"
                :options="options"
                :custom-themes="customThemes"
              />
            </div>
          </div>

          <!-- 4.2 纯图片渲染层 (Image 预览图模式) -->
          <div
            v-else-if="viewMode === 'image' && previewDataUrl"
            class="shrink-0 pointer-events-none select-none z-0"
            :style="{
              transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
              transformOrigin: 'center center',
            }"
          >
            <img
              :src="previewDataUrl"
              alt="Card Preview"
              class="shadow-2xl rounded-none pointer-events-none max-w-none block select-none"
              :style="{
                width: `${imageNaturalWidth}px`,
                height: `${imageNaturalHeight}px`,
              }"
            />
          </div>
        </div>
      </div>

      <!-- Footer: 极简纯净操作栏 -->
      <div class="px-6 py-3 bg-white dark:bg-[#18181b] border-t border-zinc-100 dark:border-white/10 flex items-center justify-end shrink-0">
        <div class="flex items-center gap-2.5">
          <!-- 复制链接按钮 -->
          <button
            v-if="!isAiPlatform && post && post.url"
            @click="handleCopyUrl"
            :disabled="!post || isExtracting || isRendering"
            class="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Check v-if="copyUrlSuccess" class="w-3.5 h-3.5 text-emerald-500" />
            <Link2 v-else class="w-3.5 h-3.5 text-zinc-400" />
            <span>{{ copyUrlSuccess ? '已复制链接' : '复制链接' }}</span>
          </button>

          <!-- 复制图片按钮 -->
          <button
            @click="handleCopy"
            :disabled="!post || isExtracting || isRendering || isCopying"
            class="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Check v-if="copySuccess" class="w-3.5 h-3.5 text-emerald-500" />
            <Loader2 v-else-if="isCopying" class="w-3.5 h-3.5 animate-spin text-zinc-400" />
            <Copy v-else class="w-3.5 h-3.5 text-zinc-400" />
            <span>{{ copySuccess ? '已复制到剪切板' : isCopying ? '正在复制...' : '复制图片' }}</span>
          </button>

          <!-- 下载 PNG 按钮 (Raycast 纯黑白主按钮) -->
          <button
            @click="handleDownload"
            :disabled="!post || isExtracting || isRendering || isDownloading"
            class="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black active:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:active:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold shadow-xs hover:shadow-sm active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Loader2 v-if="isDownloading" class="w-3.5 h-3.5 animate-spin" />
            <Download v-else class="w-3.5 h-3.5" />
            <span>{{ isDownloading ? '正在保存...' : '下载 PNG' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 导入自定义主题 JSON 弹窗 -->
    <div
      v-if="isImportModalOpen"
      class="fixed inset-0 z-[2147483648] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      @click.self="isImportModalOpen = false"
    >
      <div class="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-zinc-900 dark:text-white">导入主题 (JSON)</h3>
          <button
            @click="isImportModalOpen = false"
            class="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <p class="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          粘贴 QuickShare 主题 JSON 内容。系统会自动完成格式校验与向后兼容补全。
        </p>

        <textarea
          v-model="importJsonInput"
          placeholder="在此粘贴主题 JSON 内容..."
          rows="8"
          class="w-full font-mono text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white focus:border-zinc-900 dark:focus:border-white resize-none"
        />

        <div v-if="importError" class="text-xs text-red-500 font-medium">
          {{ importError }}
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <button
            @click="isImportModalOpen = false"
            class="px-3.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            @click="handleConfirmImport"
            class="px-4 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            确认导入
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
