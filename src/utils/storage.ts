import type { CardThemeId } from '@/types/theme';

export type UiThemeMode = 'system' | 'light' | 'dark';

export const KEY_LAST_CARD_THEME = 'quickshare_last_card_theme';
export const KEY_LAST_SHOW_OUTER_PADDING = 'quickshare_last_show_outer_padding';
export const KEY_UI_THEME_MODE = 'quickshare_ui_theme_mode';

function getStorageApi() {
  const g = globalThis as any;
  if (typeof g.chrome !== 'undefined' && g.chrome.storage?.local) {
    return g.chrome.storage;
  }
  if (typeof browser !== 'undefined' && browser.storage?.local) {
    return browser.storage;
  }
  return null;
}

/**
 * 获取上次选中的卡片主题 ID
 */
export async function getLastCardTheme(): Promise<CardThemeId | null> {
  try {
    const storage = getStorageApi();
    if (!storage) return null;
    const data = await storage.local.get(KEY_LAST_CARD_THEME);
    return (data[KEY_LAST_CARD_THEME] as CardThemeId) || null;
  } catch (e) {
    console.warn('[QuickShare] Failed to get last card theme from storage:', e);
    return null;
  }
}

/**
 * 保存用户当前选中的卡片主题 ID
 */
export async function setLastCardTheme(themeId: CardThemeId): Promise<void> {
  try {
    const storage = getStorageApi();
    if (!storage) return;
    await storage.local.set({
      [KEY_LAST_CARD_THEME]: themeId,
    });
  } catch (e) {
    console.warn('[QuickShare] Failed to save card theme to storage:', e);
  }
}

/**
 * 获取上次是否开启外层背景边距
 */
export async function getLastShowOuterPadding(): Promise<boolean> {
  try {
    const storage = getStorageApi();
    if (!storage) return true;
    const data = await storage.local.get(KEY_LAST_SHOW_OUTER_PADDING);
    if (typeof data[KEY_LAST_SHOW_OUTER_PADDING] === 'boolean') {
      return data[KEY_LAST_SHOW_OUTER_PADDING];
    }
    return true;
  } catch (e) {
    return true;
  }
}

/**
 * 保存用户是否开启外层背景边距
 */
export async function setLastShowOuterPadding(show: boolean): Promise<void> {
  try {
    const storage = getStorageApi();
    if (!storage) return;
    await storage.local.set({
      [KEY_LAST_SHOW_OUTER_PADDING]: show,
    });
  } catch (e) {
    console.warn('[QuickShare] Failed to save show outer padding to storage:', e);
  }
}

/**
 * 获取插件 UI 主题偏好 ('system' | 'light' | 'dark')
 */
export async function getUiThemeMode(): Promise<UiThemeMode> {
  try {
    const storage = getStorageApi();
    if (!storage) return 'system';
    const data = await storage.local.get(KEY_UI_THEME_MODE);
    return (data[KEY_UI_THEME_MODE] as UiThemeMode) || 'system';
  } catch (e) {
    console.warn('[QuickShare] Failed to get UI theme mode from storage:', e);
    return 'system';
  }
}

/**
 * 设置插件 UI 主题偏好 ('system' | 'light' | 'dark')
 */
export async function setUiThemeMode(mode: UiThemeMode): Promise<void> {
  try {
    const storage = getStorageApi();
    if (!storage) return;
    await storage.local.set({
      [KEY_UI_THEME_MODE]: mode,
    });
  } catch (e) {
    console.warn('[QuickShare] Failed to save UI theme mode to storage:', e);
  }
}

/**
 * 监听 Storage 变更
 */
export function onStorageChanged(
  callback: (changes: Record<string, { oldValue?: any; newValue?: any }>) => void
): () => void {
  const storage = getStorageApi();
  if (!storage?.onChanged) {
    return () => {};
  }

  const listener = (changes: Record<string, any>, areaName: string) => {
    if (areaName === 'local') {
      callback(changes);
    }
  };

  try {
    storage.onChanged.addListener(listener);
    return () => {
      storage.onChanged.removeListener(listener);
    };
  } catch {
    return () => {};
  }
}
