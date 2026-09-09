<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { Sun, Moon, Laptop } from 'lucide-vue-next';
import QuickShareLogo from '@/components/icons/QuickShareLogo.vue';
import { getUiThemeMode, setUiThemeMode, type UiThemeMode } from '@/utils/storage';

const currentUiMode = ref<UiThemeMode>('system');
const systemPrefersDark = ref(false);

const isDarkMode = computed(() => {
  if (currentUiMode.value === 'dark') return true;
  if (currentUiMode.value === 'light') return false;
  return systemPrefersDark.value;
});

// 监听并在 <html> 根节点响应式同步 .dark 类，确保 Tailwind dark: 变体全局生效
watch(
  isDarkMode,
  (dark) => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', dark);
      document.body.className = dark ? 'bg-[#18181b] text-zinc-100' : 'bg-white text-zinc-800';
    }
  },
  { immediate: true }
);

onMounted(async () => {
  currentUiMode.value = await getUiThemeMode();
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    systemPrefersDark.value = mq.matches;
    mq.addEventListener('change', (e) => {
      systemPrefersDark.value = e.matches;
    });
  }
});

const handleSelectMode = async (mode: UiThemeMode) => {
  currentUiMode.value = mode;
  await setUiThemeMode(mode);
};
</script>

<template>
  <div
    class="w-80 bg-white dark:bg-[#18181b] p-5 text-zinc-800 dark:text-zinc-100 font-sans shadow-xl select-none transition-colors"
  >
    <!-- Header: Apple / Raycast 风格 -->
    <div class="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-white/10">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center shrink-0 shadow-xs">
          <QuickShareLogo :size="20" />
        </div>
        <div>
          <div class="flex items-center gap-1.5">
            <h1 class="text-sm font-bold text-zinc-900 dark:text-white leading-tight">QuickShare</h1>
            <span class="text-[10px] px-1.5 py-0.5 rounded-md font-mono bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 font-medium">v0.1.0</span>
          </div>
          <p class="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">社交媒体卡片化快速分享</p>
        </div>
      </div>
    </div>

    <!-- UI Theme Mode Switcher -->
    <div class="mb-4 space-y-2">
      <div class="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
        弹窗外观 (Modal Theme)
      </div>
      <div class="grid grid-cols-3 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200/60 dark:border-white/5">
        <button
          type="button"
          @click="handleSelectMode('system')"
          class="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer focus:outline-none"
          :class="[
            currentUiMode === 'system'
              ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white font-semibold shadow-xs'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
          ]"
        >
          <Laptop class="w-3.5 h-3.5" />
          <span>系统</span>
        </button>

        <button
          type="button"
          @click="handleSelectMode('light')"
          class="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer focus:outline-none"
          :class="[
            currentUiMode === 'light'
              ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white font-semibold shadow-xs'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
          ]"
        >
          <Sun class="w-3.5 h-3.5" />
          <span>明亮</span>
        </button>

        <button
          type="button"
          @click="handleSelectMode('dark')"
          class="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer focus:outline-none"
          :class="[
            currentUiMode === 'dark'
              ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white font-semibold shadow-xs'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
          ]"
        >
          <Moon class="w-3.5 h-3.5" />
          <span>暗黑</span>
        </button>
      </div>
    </div>

    <!-- Supported Platforms -->
    <div class="space-y-2">
      <div class="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
        已深度适配站点
      </div>

      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-white/5 text-zinc-700 dark:text-zinc-200 font-medium">
          <img src="https://abs.twimg.com/favicons/twitter.3.ico" alt="x" class="w-4 h-4 object-contain" />
          <span class="truncate">X (Twitter)</span>
        </div>

        <div class="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-white/5 text-zinc-700 dark:text-zinc-200 font-medium">
          <img src="https://static.zhihu.com/heifetz/favicon.ico" alt="zhihu" class="w-4 h-4 object-contain" />
          <span class="truncate">知乎 (Zhihu)</span>
        </div>

        <div class="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-white/5 text-zinc-700 dark:text-zinc-200 font-medium">
          <img src="https://chatgpt.com/favicon.ico" alt="chatgpt" class="w-4 h-4 object-contain" />
          <span class="truncate">ChatGPT</span>
        </div>

        <div class="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-white/5 text-zinc-700 dark:text-zinc-200 font-medium">
          <img src="https://www.gstatic.com/lamda/images/gemini_sparkle_4g_512_lt_f94943af3be039176192d.png" alt="gemini" class="w-4 h-4 object-contain" />
          <span class="truncate">Google Gemini</span>
        </div>
      </div>
    </div>

    <!-- Instructions -->
    <div class="mt-4 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed border border-zinc-200/60 dark:border-white/5">
      在支持的站点点击 <span class="font-semibold text-zinc-900 dark:text-white">QuickShare</span> 按钮，或划选文字右键即可生成高清卡片。
    </div>

    <!-- Footer -->
    <div class="mt-4 pt-3 border-t border-zinc-100 dark:border-white/10 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
      <span class="flex items-center gap-1.5 font-medium">
        <QuickShareLogo :size="13" />
        QuickShare
      </span>
      <span>By Ryan Cui</span>
    </div>
  </div>
</template>

