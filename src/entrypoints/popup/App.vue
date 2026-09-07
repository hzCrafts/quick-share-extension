<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Sparkles, Globe, Sun, Moon, Laptop } from 'lucide-vue-next';
import { getUiThemeMode, setUiThemeMode, type UiThemeMode } from '@/utils/storage';

const currentUiMode = ref<UiThemeMode>('system');
const systemPrefersDark = ref(false);

const isDarkMode = computed(() => {
  if (currentUiMode.value === 'dark') return true;
  if (currentUiMode.value === 'light') return false;
  return systemPrefersDark.value;
});

onMounted(async () => {
  currentUiMode.value = await getUiThemeMode();
  if (typeof window !== 'undefined' && window.matchMedia) {
    systemPrefersDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
});

const handleSelectMode = async (mode: UiThemeMode) => {
  currentUiMode.value = mode;
  await setUiThemeMode(mode);
};
</script>

<template>
  <div
    class="w-80 bg-white dark:bg-slate-900 p-5 text-slate-800 dark:text-slate-100 font-sans shadow-lg select-none transition-colors"
    :class="{ dark: isDarkMode }"
  >
    <!-- Header -->
    <div class="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
      <div class="p-2 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-xl">
        <Sparkles class="w-5 h-5" />
      </div>
      <div>
        <h1 class="text-sm font-bold text-slate-900 dark:text-white leading-tight">QuickShare</h1>
        <p class="text-xs text-slate-400 dark:text-slate-500">社交媒体卡片化快速分享</p>
      </div>
    </div>

    <!-- UI Theme Mode Switcher -->
    <div class="mb-4 space-y-2">
      <div class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
        弹窗外观 (Modal Theme)
      </div>
      <div class="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
        <button
          type="button"
          @click="handleSelectMode('system')"
          class="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer"
          :class="[
            currentUiMode === 'system'
              ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 font-bold shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          ]"
        >
          <Laptop class="w-3.5 h-3.5" />
          <span>系统</span>
        </button>

        <button
          type="button"
          @click="handleSelectMode('light')"
          class="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer"
          :class="[
            currentUiMode === 'light'
              ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 font-bold shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          ]"
        >
          <Sun class="w-3.5 h-3.5" />
          <span>明亮</span>
        </button>

        <button
          type="button"
          @click="handleSelectMode('dark')"
          class="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer"
          :class="[
            currentUiMode === 'dark'
              ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 font-bold shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          ]"
        >
          <Moon class="w-3.5 h-3.5" />
          <span>暗黑</span>
        </button>
      </div>
    </div>

    <!-- Supported Platforms -->
    <div class="space-y-2">
      <div class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
        已深度适配站点
      </div>

      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-medium">
          <img src="https://abs.twimg.com/favicons/twitter.3.ico" alt="x" class="w-4 h-4 object-contain" />
          <span class="truncate">X (Twitter)</span>
        </div>

        <div class="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-medium">
          <img src="https://static.zhihu.com/heifetz/favicon.ico" alt="zhihu" class="w-4 h-4 object-contain" />
          <span class="truncate">知乎 (Zhihu)</span>
        </div>

        <div class="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-medium">
          <img src="https://chatgpt.com/favicon.ico" alt="chatgpt" class="w-4 h-4 object-contain" />
          <span class="truncate">ChatGPT</span>
        </div>

        <div class="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-medium">
          <img src="https://www.gstatic.com/lamda/images/gemini_sparkle_4g_512_lt_f94943af3be039176192d.png" alt="gemini" class="w-4 h-4 object-contain" />
          <span class="truncate">Google Gemini</span>
        </div>
      </div>
    </div>

    <!-- Instructions -->
    <div class="mt-4 p-3 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed border border-slate-100/80 dark:border-slate-800/60">
      💡 在帖子操作栏点击 <span class="font-semibold text-slate-700 dark:text-slate-200">QuickShare</span> 按钮，或在帖子内划选文字右键即可生成高清卡片。
    </div>

    <!-- Footer -->
    <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
      <span class="flex items-center gap-1">
        <Globe class="w-3.5 h-3.5" />
        v0.1.0
      </span>
      <span>By Ryan Cui</span>
    </div>
  </div>
</template>

