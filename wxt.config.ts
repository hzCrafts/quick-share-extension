import { defineConfig } from 'wxt';
import vue from '@vitejs/plugin-vue';

// https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  vite: () => ({
    plugins: [vue()],
    build: {
      assetsInlineLimit: 150 * 1024, // 确保 woff2 字体直接内联打包进 CSS，避免 Content Script 跨域/相对路径解析异常
    },
  }),
  manifest: {
    name: 'Quick Share - 社交媒体卡片分享',
    description: '快速将 X/Twitter、知乎等社交媒体帖子转化为精美分享卡片图',
    permissions: ['storage', 'contextMenus', 'clipboardWrite'],
    host_permissions: ['*://*/*'],
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      128: 'icon/128.png',
    },
    action: {
      default_title: 'QuickShare - 社交媒体卡片分享',
      default_icon: {
        16: 'icon/16.png',
        32: 'icon/32.png',
        48: 'icon/48.png',
        128: 'icon/128.png',
      },
    },
  },
});
