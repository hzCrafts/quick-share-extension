<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number | string;
    className?: string;
  }>(),
  {
    size: 20,
    className: '',
  }
);
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :class="className"
  >
    <defs>
      <linearGradient id="qs-logo-front" x1="6" y1="2" x2="22" y2="18" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#0A84FF" />
        <stop offset="100%" stop-color="#0066CC" />
      </linearGradient>
      <linearGradient id="qs-logo-back" x1="2" y1="5" x2="18" y2="21" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#5AC8FA" />
        <stop offset="100%" stop-color="#0A84FF" />
      </linearGradient>
    </defs>
    <!-- 后层通透卡片衬底 -->
    <rect x="2.5" y="6.5" width="13.5" height="14" rx="3.5" fill="url(#qs-logo-back)" fill-opacity="0.5" />
    <!-- 前层主卡片 -->
    <rect x="6.5" y="3.5" width="15" height="15.5" rx="4" fill="url(#qs-logo-front)" />
    <!-- 表面 1px 高光边刃 -->
    <rect x="7" y="4" width="14" height="14.5" rx="3.5" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="0.8" />
    <!-- 纯粹流畅的 45° 跃出分享箭头 -->
    <path
      d="M10.5 15L17.5 8M17.5 8H12.5M17.5 8V13"
      stroke="#FFFFFF"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
