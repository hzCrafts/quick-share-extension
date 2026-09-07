import { defineConfig } from 'wxt';
import vue from '@vitejs/plugin-vue';

// https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  vite: () => ({
    plugins: [vue()],
  }),
  manifest: {
    name: 'Quick Share - 社交媒体卡片分享',
    description: '快速将 X/Twitter、知乎等社交媒体帖子转化为精美分享卡片图',
    permissions: ['storage', 'contextMenus', 'clipboardWrite'],
    host_permissions: ['*://*/*'],
  },
});
