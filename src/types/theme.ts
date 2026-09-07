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
  padding: number; // 16, 24, 32, 48
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
      outerBackground: 'linear-gradient(135deg, #ffffff 0%, #fffbf8 50%, #fef4f4 100%)',
      cardBackground: 'linear-gradient(135deg, #ffffff 0%, #fffbf8 50%, #fef4f4 100%)',
      cardBackdropFilter: 'none',
      cardBorder: 'none',
      cardShadow: '0 20px 40px -15px rgba(244, 63, 94, 0.10), 0 8px 16px -6px rgba(0, 0, 0, 0.04)',
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
      outerBackground: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      cardBackground: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      cardBackdropFilter: 'none',
      cardBorder: 'none',
      cardShadow: '0 24px 48px -15px rgba(0, 0, 0, 0.5), 0 8px 20px -6px rgba(37, 99, 235, 0.2)',
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
      outerBackground: 'linear-gradient(135deg, #162a31 0%, #0e1e24 100%)',
      cardBackground: 'linear-gradient(135deg, #162a31 0%, #0e1e24 100%)',
      cardBackdropFilter: 'none',
      cardBorder: 'none',
      cardShadow: '0 24px 48px -15px rgba(0, 0, 0, 0.5), 0 8px 20px -6px rgba(13, 148, 136, 0.2)',
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
      outerBackground: 'linear-gradient(135deg, #27272a 0%, #18181b 100%)',
      cardBackground: 'linear-gradient(135deg, #27272a 0%, #18181b 100%)',
      cardBackdropFilter: 'none',
      cardBorder: 'none',
      cardShadow: '0 24px 48px -15px rgba(0, 0, 0, 0.6), 0 8px 16px -4px rgba(0, 0, 0, 0.4)',
      textPrimary: '#fafafa',
      textSecondary: '#a1a1aa',
      promptBg: 'rgba(255, 255, 255, 0.05)',
      promptBorder: 'none',
      quoteBg: 'rgba(255, 255, 255, 0.04)',
      quoteBorder: '#71717a',
      codeBg: '#27272a',
      codeText: '#fafafa',
      tableBorder: '#27272a',
      tableHeaderBg: '#27272a',
      tableRowEvenBg: '#1c1c20',
      fontFamily: 'sans',
      isDark: true,
    },
  },
  'modern-light': {
    id: 'modern-light',
    name: '纯净极简 (Light)',
    tokens: {
      outerBackground: '#ffffff',
      cardBackground: '#ffffff',
      cardBackdropFilter: 'none',
      cardBorder: 'none',
      cardShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.07), 0 6px 12px -4px rgba(15, 23, 42, 0.03)',
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
      outerBackground: 'linear-gradient(135deg, #faf7f2 0%, #f4ede3 100%)',
      cardBackground: 'linear-gradient(135deg, #faf7f2 0%, #f4ede3 100%)',
      cardBackdropFilter: 'none',
      cardBorder: 'none',
      cardShadow: '0 20px 40px -15px rgba(44, 40, 37, 0.08), 0 6px 12px -4px rgba(44, 40, 37, 0.03)',
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
      outerBackground: 'linear-gradient(135deg, #2e2640 0%, #1c1829 100%)',
      cardBackground: 'linear-gradient(135deg, #2e2640 0%, #1c1829 100%)',
      cardBackdropFilter: 'none',
      cardBorder: 'none',
      cardShadow: '0 25px 50px -15px rgba(0, 0, 0, 0.5), 0 10px 20px -6px rgba(124, 58, 237, 0.2)',
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
