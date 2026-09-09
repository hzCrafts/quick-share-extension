<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import type { PostData } from '@/types/post';
import ShareModal from '@/components/modal/ShareModal.vue';
import QuickShareLogo from '@/components/icons/QuickShareLogo.vue';
import { getUiThemeMode, onStorageChanged, KEY_UI_THEME_MODE, type UiThemeMode } from '@/utils/storage';

const currentPost = ref<PostData | null>(null);
const isModalVisible = ref(false);
const isExtracting = ref(false);

// 动态同步 Shadow DOM Host 容器的 pointer-events
// 弹窗开启时捕获整屏事件，避免浏览器在宿主页面与扩展弹窗之间冲突跳动光标；关闭时穿透宿主页面
watch(isModalVisible, (visible) => {
  try {
    const rootHost = document.querySelector('quick-share-ui-container') as HTMLElement | null;
    if (rootHost) {
      rootHost.style.setProperty('pointer-events', visible ? 'auto' : 'none', 'important');
    }
  } catch {}
});

// UI 模式与深色模式状态管理
const uiMode = ref<UiThemeMode>('system');
const systemPrefersDark = ref(false);
let unsubscribeStorage: (() => void) | null = null;
let mediaQuery: MediaQueryList | null = null;

const isDarkMode = computed(() => {
  if (uiMode.value === 'dark') return true;
  if (uiMode.value === 'light') return false;
  return systemPrefersDark.value;
});

const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
  systemPrefersDark.value = e.matches;
};

onMounted(async () => {
  uiMode.value = await getUiThemeMode();

  if (typeof window !== 'undefined' && window.matchMedia) {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    systemPrefersDark.value = mediaQuery.matches;
    mediaQuery.addEventListener('change', handleMediaChange);
  }

  unsubscribeStorage = onStorageChanged((changes) => {
    if (changes[KEY_UI_THEME_MODE]) {
      uiMode.value = changes[KEY_UI_THEME_MODE].newValue || 'system';
    }
  });
});

onUnmounted(() => {
  if (unsubscribeStorage) unsubscribeStorage();
  if (mediaQuery) {
    mediaQuery.removeEventListener('change', handleMediaChange);
  }
});

const openShareModal = async (postOrPromise: PostData | Promise<PostData | null>) => {
  // 唤起前即时同步最新配置
  uiMode.value = await getUiThemeMode();
  isModalVisible.value = true;
  hideFloatingButton();

  // 1. 将 Shadow DOM Host 节点移至 document.body 末尾，确保在 DOM 顺序与 Stacking Context 中拥有最高优先级
  try {
    const rootHost = document.querySelector('quick-share-ui-container') as HTMLElement | null;
    if (rootHost && rootHost.parentElement === document.body) {
      document.body.appendChild(rootHost);
    }
  } catch {}

  // 2. 清除页面划选高亮并触发 selectionchange 事件，通知宿主页面（如 ChatGPT / 知乎 / Gemini）立即销毁自带的悬浮操作条
  try {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) {
      sel.removeAllRanges();
    }
    document.dispatchEvent(new Event('selectionchange'));
  } catch {}

  // 3. 针对 ChatGPT / Radix 等残留的弹出层进行辅助隐藏
  try {
    document.querySelectorAll('[data-radix-popper-content-wrapper], [data-radix-portal]').forEach((el) => {
      if (el.textContent?.includes('ChatGPT') || el.textContent?.includes('询问') || el.textContent?.includes('Ask')) {
        (el as HTMLElement).style.setProperty('display', 'none', 'important');
      }
    });
  } catch {}

  if (postOrPromise instanceof Promise) {
    currentPost.value = null;
    isExtracting.value = true;
    postOrPromise
      .then((post) => {
        if (post && isModalVisible.value) {
          currentPost.value = post;
        } else if (!post) {
          isModalVisible.value = false;
        }
      })
      .catch((err) => {
        console.error('[QuickShare] Extract failed:', err);
        isModalVisible.value = false;
      })
      .finally(() => {
        isExtracting.value = false;
      });
  } else {
    currentPost.value = postOrPromise;
    isExtracting.value = false;
  }
};

const closeModal = () => {
  isModalVisible.value = false;
  currentPost.value = null;
  isExtracting.value = false;
};

// 划词悬浮按钮状态与控制
const isFloatingVisible = ref(false);
const floatingPosition = ref({ x: 0, y: 0 });
let onFloatingClickCallback: (() => void) | null = null;

const showFloatingButton = (x: number, y: number, onClick: () => void) => {
  floatingPosition.value = { x, y };
  onFloatingClickCallback = onClick;
  isFloatingVisible.value = true;
};

const hideFloatingButton = () => {
  isFloatingVisible.value = false;
  onFloatingClickCallback = null;
};

const handleFloatingClick = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  const cb = onFloatingClickCallback;
  hideFloatingButton();
  if (cb) {
    cb();
  }
};

defineExpose({
  openShareModal,
  showFloatingButton,
  hideFloatingButton,
});
</script>

<template>
  <div
    class="quick-share-root font-sans antialiased"
    :class="[
      { dark: isDarkMode },
      isModalVisible ? 'pointer-events-auto' : 'pointer-events-none'
    ]"
    :style="{
      position: 'fixed',
      inset: '0',
      width: '100vw',
      height: '100vh',
      zIndex: 2147483647,
      pointerEvents: isModalVisible ? 'auto' : 'none'
    }"
  >
    <!-- 划词悬浮快捷唤起按钮 -->
    <div
      v-if="isFloatingVisible && !isModalVisible"
      class="fixed z-[2147483647] -translate-x-1/2 -translate-y-full mb-2 pointer-events-auto transition-all duration-150"
      :style="{
        left: `${floatingPosition.x}px`,
        top: `${floatingPosition.y}px`,
      }"
    >
      <button
        type="button"
        @mousedown.prevent="handleFloatingClick"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-semibold shadow-2xl hover:bg-black hover:scale-105 active:scale-95 transition-all backdrop-blur-md border border-white/15 cursor-pointer select-none pointer-events-auto"
      >
        <QuickShareLogo :size="15" />
        <span>QuickShare</span>
      </button>
    </div>

    <ShareModal
      v-if="isModalVisible"
      :post="currentPost"
      :is-extracting="isExtracting"
      :visible="isModalVisible"
      @close="closeModal"
    />
  </div>
</template>
