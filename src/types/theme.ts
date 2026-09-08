export type CardThemeId = 
  | 'modern-dark' 
  | 'modern-light' 
  | 'gradient-sunset' 
  | 'gradient-ocean' 
  | 'gradient-nord' 
  | 'paper-warm' 
  | 'card-glass';

export interface CardThemeTokens {
  outerBackground: string;
  cardBackground: string;
  cardBackdropFilter: string;
  cardBorder: string;
  cardShadow: string;
  textPrimary: string;
  textSecondary: string;
  promptBg: string;
  promptBorder: string;
  quoteBg: string;
  quoteBorder: string;
  codeBg: string;
  codeText: string;
  tableBorder: string;
  tableHeaderBg: string;
  tableRowEvenBg: string;
  fontFamily: 'sans' | 'serif';
  isDark: boolean;
}

export interface CardThemeConfig {
  id: CardThemeId;
  name: string;
  tokens: CardThemeTokens;
}

export interface CardRenderOptions {
  themeId: CardThemeId;
  showOuterPadding: boolean; // 是否启用外层直角背景边距
  padding: number; // 24, 32
  showQrCode: boolean;
  showWatermark: boolean;
  showStats: boolean;
  fontScale: number; // 0.9, 1.0, 1.1, 1.2
  cardRadius: number; // 8, 16, 24
  authorAvatarRadius: 'rounded-full' | 'rounded-xl' | 'rounded-none';
  aspectRatio: 'auto' | '1:1' | '4:3' | '16:9';
}

export const PRESET_THEMES: Record<CardThemeId, CardThemeConfig> = {
  'gradient-sunset': {
    id: 'gradient-sunset',
    name: '落日余晖 (Sunset)',
    tokens: {
      outerBackground: 'linear-gradient(135deg, #ffedd5 0%, #fee2e2 50%, #f1f5f9 100%)',
      cardBackground: '#ffffff',
      cardBackdropFilter: 'none',
      cardBorder: 'none',
      cardShadow: '0 32px 64px -16px rgba(244, 63, 94, 0.25), 0 16px 32px -8px rgba(0, 0, 0, 0.10), 0 0 1px rgba(0, 0, 0, 0.08)',
      textPrimary: '#0f172a',
      textSecondary: '#64748b',
      promptBg: 'rgba(244, 63, 94, 0.04)',
      promptBorder: 'none',
      quoteBg: 'rgba(244, 63, 94, 0.04)',
      quoteBorder: '#f43f5e',
      codeBg: 'rgba(15, 23, 42, 0.04)',
      codeText: '#0f172a',
      tableBorder: 'rgba(15, 23, 42, 0.08)',
      tableHeaderBg: 'rgba(15, 23, 42, 0.04)',
      tableRowEvenBg: 'rgba(15, 23, 42, 0.02)',
      fontFamily: 'sans',
      isDark: false,
    },
  },
  'gradient-ocean': {
    id: 'gradient-ocean',
    name: '蔚蓝深海 (Ocean)',
    tokens: {
      outerBackground: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)',
      cardBackground: '#1e293b',
      cardBackdropFilter: 'none',
      cardBorder: 'none',
      cardShadow: '0 36px 72px -16px rgba(0, 0, 0, 0.90), 0 16px 36px -8px rgba(37, 99, 235, 0.40), 0 0 1px rgba(255, 255, 255, 0.15)',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      promptBg: 'rgba(56, 189, 248, 0.06)',
      promptBorder: 'none',
      quoteBg: 'rgba(56, 189, 248, 0.05)',
      quoteBorder: '#38bdf8',
      codeBg: 'rgba(255, 255, 255, 0.06)',
      codeText: '#f8fafc',
      tableBorder: 'rgba(255, 255, 255, 0.10)',
      tableHeaderBg: 'rgba(255, 255, 255, 0.06)',
      tableRowEvenBg: 'rgba(255, 255, 255, 0.02)',
      fontFamily: 'sans',
      isDark: true,
    },
  },
  'gradient-nord': {
    id: 'gradient-nord',
    name: '极光冷调 (Nord)',
    tokens: {
      outerBackground: 'linear-gradient(135deg, #0b1d22 0%, #134e4a 50%, #0f172a 100%)',
      cardBackground: '#162a31',
      cardBackdropFilter: 'none',
      cardBorder: 'none',
      cardShadow: '0 36px 72px -16px rgba(0, 0, 0, 0.90), 0 16px 36px -8px rgba(13, 148, 136, 0.40), 0 0 1px rgba(255, 255, 255, 0.15)',
      textPrimary: '#f1f5f9',
      textSecondary: '#5eead4',
      promptBg: 'rgba(52, 211, 153, 0.06)',
      promptBorder: 'none',
      quoteBg: 'rgba(52, 211, 153, 0.05)',
      quoteBorder: '#34d399',
      codeBg: 'rgba(255, 255, 255, 0.06)',
      codeText: '#f1f5f9',
      tableBorder: 'rgba(52, 211, 153, 0.12)',
      tableHeaderBg: 'rgba(52, 211, 153, 0.06)',
      tableRowEvenBg: 'rgba(255, 255, 255, 0.02)',
      fontFamily: 'sans',
      isDark: true,
    },
  },
  'modern-dark': {
    id: 'modern-dark',
    name: '曜石深黑 (Dark)',
    tokens: {
      outerBackground: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)',
      cardBackground: '#27272a',
      cardBackdropFilter: 'none',
      cardBorder: 'none',
      cardShadow: '0 36px 72px -16px rgba(0, 0, 0, 0.98), 0 18px 36px -8px rgba(0, 0, 0, 0.85), 0 0 1px rgba(255, 255, 255, 0.15)',
      textPrimary: '#fafafa',
      textSecondary: '#a1a1aa',
      promptBg: 'rgba(255, 255, 255, 0.05)',
      promptBorder: 'none',
      quoteBg: 'rgba(255, 255, 255, 0.04)',
      quoteBorder: '#71717a',
      codeBg: '#1c1c20',
      codeText: '#fafafa',
      tableBorder: '#3f3f46',
      tableHeaderBg: '#1c1c20',
      tableRowEvenBg: '#18181b',
      fontFamily: 'sans',
      isDark: true,
    },
  },
  'modern-light': {
    id: 'modern-light',
    name: '纯净极简 (Light)',
    tokens: {
      outerBackground: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
      cardBackground: '#ffffff',
      cardBackdropFilter: 'none',
      cardBorder: 'none',
      cardShadow: '0 30px 60px -15px rgba(15, 23, 42, 0.16), 0 12px 24px -6px rgba(15, 23, 42, 0.08), 0 0 1px rgba(15, 23, 42, 0.10)',
      textPrimary: '#0f172a',
      textSecondary: '#64748b',
      promptBg: '#f8fafc',
      promptBorder: 'none',
      quoteBg: '#f8fafc',
      quoteBorder: '#cbd5e1',
      codeBg: '#f1f5f9',
      codeText: '#0f172a',
      tableBorder: '#e2e8f0',
      tableHeaderBg: '#f8fafc',
      tableRowEvenBg: '#f8fafc',
      fontFamily: 'sans',
      isDark: false,
    },
  },
  'paper-warm': {
    id: 'paper-warm',
    name: '暖雅宣纸 (Warm Paper)',
    tokens: {
      outerBackground: 'linear-gradient(135deg, #f5efe6 0%, #e7dec8 100%)',
      cardBackground: '#faf7f2',
      cardBackdropFilter: 'none',
      cardBorder: 'none',
      cardShadow: '0 30px 60px -15px rgba(68, 51, 34, 0.20), 0 14px 28px -6px rgba(68, 51, 34, 0.10), 0 0 1px rgba(68, 51, 34, 0.10)',
      textPrimary: '#1c1917',
      textSecondary: '#78716c',
      promptBg: 'rgba(120, 113, 108, 0.05)',
      promptBorder: 'none',
      quoteBg: 'rgba(120, 113, 108, 0.04)',
      quoteBorder: '#d6c7a1',
      codeBg: 'rgba(120, 113, 108, 0.06)',
      codeText: '#1c1917',
      tableBorder: '#e7dec8',
      tableHeaderBg: '#f2eae0',
      tableRowEvenBg: '#f5efe6',
      fontFamily: 'serif',
      isDark: false,
    },
  },
  'card-glass': {
    id: 'card-glass',
    name: '毛玻璃 (Glassmorphism)',
    tokens: {
      outerBackground: 'linear-gradient(135deg, #3b0764 0%, #1e1b4b 50%, #0f172a 100%)',
      cardBackground: 'rgba(46, 38, 64, 0.85)',
      cardBackdropFilter: 'none',
      cardBorder: 'none',
      cardShadow: '0 36px 72px -16px rgba(0, 0, 0, 0.90), 0 18px 36px -8px rgba(168, 85, 247, 0.45), 0 0 1px rgba(255, 255, 255, 0.18)',
      textPrimary: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.75)',
      promptBg: 'rgba(255, 255, 255, 0.08)',
      promptBorder: 'none',
      quoteBg: 'rgba(255, 255, 255, 0.06)',
      quoteBorder: '#a855f7',
      codeBg: 'rgba(255, 255, 255, 0.10)',
      codeText: '#ffffff',
      tableBorder: 'rgba(255, 255, 255, 0.15)',
      tableHeaderBg: 'rgba(255, 255, 255, 0.08)',
      tableRowEvenBg: 'rgba(255, 255, 255, 0.03)',
      fontFamily: 'sans',
      isDark: true,
    },
  },
};
