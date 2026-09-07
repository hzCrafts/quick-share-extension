import { defineBackground } from 'wxt/sandbox';

export default defineBackground(() => {
  // 注册右键菜单
  browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({
      id: 'quick-share-selection',
      title: '使用 QuickShare 生成分享卡片',
      contexts: ['selection', 'page'],
    });
  });

  // 处理右键菜单点击
  browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'quick-share-selection' && tab?.id) {
      browser.tabs.sendMessage(tab.id, {
        type: 'QUICK_SHARE_TRIGGER_UNIVERSAL',
      });
    }
  });
});
