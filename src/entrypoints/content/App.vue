<script setup lang="ts">
import { ref } from 'vue';
import type { PostData } from '@/types/post';
import ShareModal from '@/components/modal/ShareModal.vue';

const currentPost = ref<PostData | null>(null);
const isModalVisible = ref(false);

const openShareModal = (post: PostData) => {
  currentPost.value = post;
  isModalVisible.value = true;
};

const closeModal = () => {
  isModalVisible.value = false;
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
  if (onFloatingClickCallback) {
    onFloatingClickCallback();
  }
  hideFloatingButton();
};

defineExpose({
  openShareModal,
  showFloatingButton,
  hideFloatingButton,
});
</script>

<template>
  <div class="quick-share-root font-sans antialiased">
    <!-- 划词悬浮快捷唤起按钮 -->
    <div
      v-if="isFloatingVisible && !isModalVisible"
      class="fixed z-[2147483640] -translate-x-1/2 -translate-y-full mb-2 pointer-events-auto transition-all duration-150"
      :style="{
        left: `${floatingPosition.x}px`,
        top: `${floatingPosition.y}px`,
      }"
    >
      <button
        type="button"
        @mousedown.prevent="handleFloatingClick"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-semibold shadow-2xl hover:bg-black hover:scale-105 active:scale-95 transition-all backdrop-blur-md border border-white/15 cursor-pointer select-none"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
          <circle cx="9" cy="9" r="2"/>
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
        </svg>
        <span>QuickShare</span>
      </button>
    </div>

    <ShareModal
      v-if="currentPost && isModalVisible"
      :post="currentPost"
      :visible="isModalVisible"
      @close="closeModal"
    />
  </div>
</template>
