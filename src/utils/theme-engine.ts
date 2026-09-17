import { 
  type CardThemeId, 
  type BuiltinCardThemeId,
  type QuickShareTheme, 
  BUILTIN_THEMES 
} from '@/types/theme';

const KEY_CUSTOM_THEMES = 'quickshare_custom_themes';

/**
 * 已下线旧主题的平滑无感降级映射表
 */
export const LEGACY_THEME_FALLBACK_MAP: Record<string, CardThemeId> = {
  'card-glass': 'liquid-glass',
  'paper-warm': 'craft-editorial',
  'modern-dark': 'raycast-dark',
  'modern-light': 'liquid-glass',
  'gradient-nord': 'liquid-glass',
  'gradient-sunset': 'craft-editorial',
  'gradient-ocean': 'liquid-glass',
};

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
 * 主题安全补全规范化引擎 (Theme Normalizer & Migrator)
 * 即使传入的是旧版结构、第三方简化 JSON 或缺少某些字段，也能深度合并 baseline 缺省值，确保 100% 渲染安全
 */
export function normalizeTheme(raw: any, fallbackId: BuiltinCardThemeId = 'raycast-dark'): QuickShareTheme {
  const baseline = (BUILTIN_THEMES as Record<string, QuickShareTheme>)[fallbackId] || BUILTIN_THEMES['raycast-dark'];
  if (!raw || typeof raw !== 'object') {
    return baseline;
  }

  // 处理旧版扁平 tokens 的迁移 (v0 -> v1)
  if (raw.tokens && typeof raw.tokens === 'object') {
    const t = raw.tokens;
    const isDark = typeof t.isDark === 'boolean' ? t.isDark : true;
    return {
      version: 1,
      id: String(raw.id || `custom-${Date.now()}`),
      name: String(raw.name || 'Custom Theme'),
      previewColor: t.cardBackground || t.outerBackground || '#18181b',
      ambient: {
        isDark,
        outerBackground: t.outerBackground || baseline.ambient.outerBackground,
        glows: [],
        noiseOpacity: 0,
      },
      card: {
        background: t.cardBackground || baseline.card.background,
        backdropFilter: t.cardBackdropFilter || 'none',
        border: t.cardBorder || 'none',
        borderHighlight: undefined,
        shadow: t.cardShadow || baseline.card.shadow,
        innerGlow: undefined,
      },
      typography: {
        fontFamily: t.fontFamily === 'serif' ? 'serif' : 'sans',
        textPrimary: t.textPrimary || (isDark ? '#fafafa' : '#0f172a'),
        textSecondary: t.textSecondary || (isDark ? '#a1a1aa' : '#64748b'),
      },
      components: {
        promptCard: {
          background: t.promptBg,
          border: t.promptBorder,
        },
        quoteBlock: {
          background: t.quoteBg,
          borderColor: t.quoteBorder,
        },
        codeBlock: {
          background: t.codeBg,
          color: t.codeText,
        },
        table: {
          borderColor: t.tableBorder,
          headerBg: t.tableHeaderBg,
          rowEvenBg: t.tableRowEvenBg,
        },
      },
      customVars: {},
    };
  }

  // 正常 v1 结构的递归合并补全
  const isDark = typeof raw.ambient?.isDark === 'boolean' ? raw.ambient.isDark : baseline.ambient.isDark;

  return {
    $schema: raw.$schema || undefined,
    version: 1,
    id: String(raw.id || `custom-${Date.now()}`),
    name: String(raw.name || 'Custom Theme'),
    author: raw.author ? String(raw.author) : undefined,
    description: raw.description ? String(raw.description) : undefined,
    previewColor: String(raw.previewColor || raw.ambient?.outerBackground || baseline.previewColor),
    ambient: {
      isDark,
      outerBackground: String(raw.ambient?.outerBackground || baseline.ambient.outerBackground),
      glows: Array.isArray(raw.ambient?.glows) ? raw.ambient.glows : baseline.ambient.glows || [],
      noiseOpacity: typeof raw.ambient?.noiseOpacity === 'number' ? raw.ambient.noiseOpacity : baseline.ambient.noiseOpacity,
    },
    card: {
      background: String(raw.card?.background || baseline.card.background),
      backdropFilter: raw.card?.backdropFilter || baseline.card.backdropFilter,
      border: raw.card?.border || baseline.card.border,
      borderHighlight: raw.card?.borderHighlight || baseline.card.borderHighlight,
      shadow: String(raw.card?.shadow || baseline.card.shadow),
      innerGlow: raw.card?.innerGlow || baseline.card.innerGlow,
    },
    typography: {
      fontFamily: raw.typography?.fontFamily || baseline.typography.fontFamily,
      textPrimary: String(raw.typography?.textPrimary || baseline.typography.textPrimary),
      textSecondary: String(raw.typography?.textSecondary || baseline.typography.textSecondary),
      textMuted: raw.typography?.textMuted || baseline.typography.textMuted,
      headingFontFamily: raw.typography?.headingFontFamily,
      codeFontFamily: raw.typography?.codeFontFamily,
    },
    components: {
      platformBadge: {
        ...baseline.components?.platformBadge,
        ...raw.components?.platformBadge,
      },
      promptCard: {
        ...baseline.components?.promptCard,
        ...raw.components?.promptCard,
      },
      quoteBlock: {
        ...baseline.components?.quoteBlock,
        ...raw.components?.quoteBlock,
      },
      codeBlock: {
        ...baseline.components?.codeBlock,
        ...raw.components?.codeBlock,
      },
      table: {
        ...baseline.components?.table,
        ...raw.components?.table,
      },
      footer: {
        ...baseline.components?.footer,
        ...raw.components?.footer,
      },
    },
    customVars: typeof raw.customVars === 'object' ? raw.customVars : {},
  };
}

/**
 * 导出主题为格式化 JSON 字符串
 */
export function exportThemeToJson(theme: QuickShareTheme): string {
  const exportable = {
    $schema: 'https://quickshare.app/schemas/theme.v1.json',
    ...theme,
  };
  return JSON.stringify(exportable, null, 2);
}

/**
 * 从 JSON 字符串解析并导入主题
 */
export function importThemeFromJson(jsonStr: string): { success: boolean; theme?: QuickShareTheme; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'JSON 内容必须是一个有效的对象' };
    }
    const normalized = normalizeTheme(parsed);
    // 生成唯一的自定义主题 ID (防覆盖)
    if (!normalized.id.startsWith('custom-') && BUILTIN_THEMES[normalized.id as keyof typeof BUILTIN_THEMES]) {
      normalized.id = `custom-${normalized.id}-${Date.now().toString(36)}`;
    }
    return { success: true, theme: normalized };
  } catch (err: any) {
    return { success: false, error: err?.message || 'JSON 解析失败，请检查格式' };
  }
}

/**
 * 从 Storage 加载用户自定义主题列表
 */
export async function loadCustomThemes(): Promise<QuickShareTheme[]> {
  try {
    const storage = getStorageApi();
    if (!storage) return [];
    const data = await storage.local.get(KEY_CUSTOM_THEMES);
    const list = data[KEY_CUSTOM_THEMES];
    if (Array.isArray(list)) {
      return list.map((item) => normalizeTheme(item));
    }
    return [];
  } catch (e) {
    console.warn('[QuickShare] Failed to load custom themes:', e);
    return [];
  }
}

/**
 * 保存或更新用户自定义主题
 */
export async function saveCustomTheme(theme: QuickShareTheme): Promise<void> {
  try {
    const storage = getStorageApi();
    if (!storage) return;
    const existing = await loadCustomThemes();
    const idx = existing.findIndex((t) => t.id === theme.id);
    if (idx >= 0) {
      existing[idx] = theme;
    } else {
      existing.push(theme);
    }
    await storage.local.set({ [KEY_CUSTOM_THEMES]: existing });
  } catch (e) {
    console.warn('[QuickShare] Failed to save custom theme:', e);
  }
}

/**
 * 删除用户自定义主题
 */
export async function deleteCustomTheme(themeId: string): Promise<void> {
  try {
    const storage = getStorageApi();
    if (!storage) return;
    const existing = await loadCustomThemes();
    const filtered = existing.filter((t) => t.id !== themeId);
    await storage.local.set({ [KEY_CUSTOM_THEMES]: filtered });
  } catch (e) {
    console.warn('[QuickShare] Failed to delete custom theme:', e);
  }
}

/**
 * 根据 ID 获取最终生效的主题（支持内置主题、降级映射与自定义主题）
 */
export function getThemeById(themeId: string, customThemes: QuickShareTheme[] = []): QuickShareTheme {
  // 1. 检查是否为老旧主题 ID，进行平滑降级映射
  let targetId = themeId;
  if (LEGACY_THEME_FALLBACK_MAP[themeId]) {
    targetId = LEGACY_THEME_FALLBACK_MAP[themeId];
  }

  // 2. 查找内置主题
  if (BUILTIN_THEMES[targetId as keyof typeof BUILTIN_THEMES]) {
    return BUILTIN_THEMES[targetId as keyof typeof BUILTIN_THEMES];
  }

  // 3. 查找自定义主题列表
  const custom = customThemes.find((t) => t.id === targetId);
  if (custom) {
    return custom;
  }

  // 4. 默认兜底
  return BUILTIN_THEMES['raycast-dark'];
}
