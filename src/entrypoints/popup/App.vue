<script setup lang="ts">
import { Sparkles, Globe, Share2 } from 'lucide-vue-next';

const triggerCurrentPageShare = async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    await browser.tabs.sendMessage(tab.id, {
      type: 'QUICK_SHARE_TRIGGER_UNIVERSAL',
    });
    window.close();
  }
};
</script>

<template>
  <div class="w-80 bg-white p-5 text-slate-800 font-sans shadow-lg select-none">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
      <div class="p-2 bg-sky-50 text-sky-600 rounded-xl">
        <Sparkles class="w-5 h-5" />
      </div>
      <div>
        <h1 class="text-sm font-bold text-slate-900 leading-tight">Quick Share</h1>
        <p class="text-xs text-slate-400">社交媒体卡片化快速分享</p>
      </div>
    </div>

    <!-- Quick Action -->
    <div class="mb-4">
      <button
        @click="triggerCurrentPageShare"
        class="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <Share2 class="w-4 h-4" />
        <span>生成当前页面卡片</span>
      </button>
    </div>

    <!-- Supported Platforms -->
    <div class="space-y-2">
      <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        已深度适配站点
      </div>

      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-slate-700 font-medium">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>X (Twitter)</span>
        </div>
        <div class="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-slate-700 font-medium">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>知乎 (Zhihu)</span>
        </div>
        <div class="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-slate-700 font-medium">
          <span class="w-2 h-2 rounded-full bg-sky-500"></span>
          <span>右键划选分享</span>
        </div>
        <div class="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-slate-700 font-medium">
          <span class="w-2 h-2 rounded-full bg-sky-500"></span>
          <span>通用网页快照</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
      <span class="flex items-center gap-1">
        <Globe class="w-3.5 h-3.5" />
        v0.1.0
      </span>
      <span>By Ryan Cui</span>
    </div>
  </div>
</template>
