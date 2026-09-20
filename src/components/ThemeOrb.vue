<script setup lang="ts">
import type { QuickShareTheme } from '@/types/theme';
defineProps<{ theme: QuickShareTheme }>();

const orbBackgrounds: Record<string, string> = {
  'raycast-dark':
    'radial-gradient(circle at 50% -12%, #111112 20%, #502914 48%, #e7a95b 75%, #fff0ce 100%)',
  'liquid-glass':
    'radial-gradient(circle at 30% 5%, #b3e5f7, #eaf5ff 58%, #d9d5f5)' ,
  'craft-editorial':
    'radial-gradient(circle at 40% 0%, #d6cbbb, #eee8dc 48%, #fcfaf4 85%)',
};
const orbBackground = (theme: QuickShareTheme) =>
  orbBackgrounds[theme.id] || theme.previewColor || theme.card.background;

</script>

<template>
  <span class="theme-orb" :style="{ background: orbBackground(theme) }" aria-hidden="true" />
</template>

<style scoped>
.theme-orb {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  box-shadow:
    inset 0 0 0 1px #ffffff30,
    0 2px 5px #17223214;
}
</style>
