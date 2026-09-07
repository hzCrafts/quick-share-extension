<script setup lang="ts">
import { Sparkles, Globe } from 'lucide-vue-next';
</script>

<template>
  <div class="w-72 bg-white p-5 text-slate-800 font-sans shadow-lg select-none">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
      <div class="p-2 bg-sky-50 text-sky-600 rounded-xl">
        <Sparkles class="w-5 h-5" />
      </div>
      <div>
        <h1 class="text-sm font-bold text-slate-900 leading-tight">QuickShare</h1>
        <p class="text-xs text-slate-400">社交媒体卡片化快速分享</p>
      </div>
    </div>

    <!-- Supported Platforms -->
    <div class="space-y-2">
      <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        已深度适配站点
      </div>

      <div class="flex flex-col gap-2 text-xs">
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-slate-700 font-medium">
          <div class="flex items-center gap-2">
            <img src="https://abs.twimg.com/favicons/twitter.3.ico" alt="x" class="w-4 h-4 object-contain" />
            <span>X (Twitter)</span>
          </div>
          <span class="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">已启用</span>
        </div>

        <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-slate-700 font-medium">
          <div class="flex items-center gap-2">
            <img src="https://static.zhihu.com/heifetz/favicon.ico" alt="zhihu" class="w-4 h-4 object-contain" />
            <span>知乎 (Zhihu)</span>
          </div>
          <span class="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">已启用</span>
        </div>
      </div>
    </div>

    <!-- Instructions -->
    <div class="mt-4 p-3 bg-slate-50/80 rounded-xl text-[11px] text-slate-500 leading-relaxed">
      💡 在帖子操作栏点击 <span class="font-semibold text-slate-700">QuickShare</span> 按钮，或在帖子内划选文字右键即可生成分享卡片。
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
