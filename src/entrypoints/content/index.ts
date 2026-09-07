import { defineContentScript } from 'wxt/sandbox';
import { createApp } from 'vue';
import App from './App.vue';
import { getAdapterForUrl } from '@/adapters';
import '@/assets/style.css';

export default defineContentScript({
  matches: [
    '*://*.x.com/*',
    '*://*.twitter.com/*',
    '*://*.zhihu.com/*',
    '*://zhihu.com/*',
  ],
  cssInjectionMode: 'ui',

  async main(ctx) {
    // 检查扩展上下文是否有效
    if (!browser.runtime?.id || !ctx.isValid) return;

    let appInstance: any = null;

    // 创建 Shadow DOM UI 容器，将 Tailwind 样式隔离注入
    const ui = await createShadowRootUi(ctx, {
      name: 'quick-share-ui-container',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      onMount: (container) => {
        const app = createApp(App);
        appInstance = app.mount(container);
        return app;
      },
      onRemove: (app) => {
        app?.unmount();
      },
    });

    ui.mount();

    // 匹配并启动当前站点的适配器
    const adapter = getAdapterForUrl();
    adapter.start((postData) => {
      if (!ctx.isValid) return;
      if (appInstance && appInstance.openShareModal) {
        appInstance.openShareModal(postData);
      }
    });

    // 当扩展更新/重载导致上下文失效时，优雅清理
    ctx.onInvalidated(() => {
      adapter.stop();
    });

    // 安全监听来自 Background 的消息
    try {
      if (browser.runtime?.onMessage) {
        const onMessageListener = (message: unknown) => {
          if (!ctx.isValid) return;
          if (typeof message === 'object' && message !== null && 'type' in message) {
            const msg = message as { type: string };
            if (msg.type === 'QUICK_SHARE_TRIGGER_UNIVERSAL') {
              const universalAdapter = getAdapterForUrl(new URL('https://universal.share'));
              universalAdapter.extract().then((postData) => {
                if (postData && appInstance && ctx.isValid) {
                  appInstance.openShareModal(postData);
                }
              });
            }
          }
        };

        browser.runtime.onMessage.addListener(onMessageListener);
      }
    } catch (e) {
      // 忽略上下文已销毁时的监听错误
    }
  },
});
