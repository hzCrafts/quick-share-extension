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
      outerBackground: 'linear-gradient(135deg, #f59e0b 0%, #f43f5e 50%, #9333ea 100%)',
      cardBackground: 'rgba(255, 255, 255, 0.95)',
      cardBackdropFilter: 'blur(16px)',
      cardBorder: '1px solid rgba(255, 255, 255, 0.45)',
      cardShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      textPrimary: '#0f172a',
      textSecondary: '#64748b',
      promptBg: 'rgba(15, 23, 42, 0.05)',
      promptBorder: '1px solid rgba(15, 23, 42, 0.08)',
      quoteBg: 'rgba(15, 23, 42, 0.04)',
      quoteBorder: '#f43f5e',
      codeBg: 'rgba(15, 23, 42, 0.06)',
      codeText: '#0f172a',
      tableBorder: 'rgba(15, 23, 42, 0.12)',
      tableHeaderBg: 'rgba(15, 23, 42, 0.06)',
      tableRowEvenBg: 'rgba(15, 23, 42, 0.02)',
      fontFamily: 'sans',
      isDark: false,
    },
  },
  'gradient-ocean': {
    id: 'gradient-ocean',
    name: '蔚蓝深海 (Ocean)',
    tokens: {
      outerBackground: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 50%, #1e1b4b 100%)',
      cardBackground: 'rgba(15, 23, 42, 0.92)',
      cardBackdropFilter: 'blur(20px)',
      cardBorder: '1px solid rgba(255, 255, 255, 0.15)',
      cardShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      promptBg: 'rgba(255, 255, 255, 0.07)',
      promptBorder: '1px solid rgba(255, 255, 255, 0.12)',
      quoteBg: 'rgba(255, 255, 255, 0.05)',
      quoteBorder: '#38bdf8',
      codeBg: 'rgba(255, 255, 255, 0.10)',
      codeText: '#f8fafc',
      tableBorder: 'rgba(255, 255, 255, 0.15)',
      tableHeaderBg: 'rgba(255, 255, 255, 0.08)',
      tableRowEvenBg: 'rgba(255, 255, 255, 0.03)',
      fontFamily: 'sans',
      isDark: true,
    },
  },
  'gradient-nord': {
    id: 'gradient-nord',
    name: '极光冷调 (Nord)',
    tokens: {
      outerBackground: 'linear-gradient(135deg, #34d399 0%, #0d9488 50%, #155e75 100%)',
      cardBackground: 'rgba(15, 23, 42, 0.94)',
      cardBackdropFilter: 'blur(20px)',
      cardBorder: '1px solid rgba(52, 211, 153, 0.25)',
      cardShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      textPrimary: '#f1f5f9',
      textSecondary: '#6ee7b7',
      promptBg: 'rgba(52, 211, 153, 0.08)',
      promptBorder: '1px solid rgba(52, 211, 153, 0.20)',
      quoteBg: 'rgba(52, 211, 153, 0.06)',
      quoteBorder: '#34d399',
      codeBg: 'rgba(255, 255, 255, 0.10)',
      codeText: '#f1f5f9',
      tableBorder: 'rgba(52, 211, 153, 0.20)',
      tableHeaderBg: 'rgba(52, 211, 153, 0.10)',
      tableRowEvenBg: 'rgba(255, 255, 255, 0.03)',
      fontFamily: 'sans',
      isDark: true,
    },
  },
  'modern-dark': {
    id: 'modern-dark',
    name: '曜石深黑 (Dark)',
    tokens: {
      outerBackground: '#09090b',
      cardBackground: '#18181b',
      cardBackdropFilter: 'none',
      cardBorder: '1px solid #27272a',
      cardShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)',
      textPrimary: '#fafafa',
      textSecondary: '#a1a1aa',
      promptBg: 'rgba(255, 255, 255, 0.05)',
      promptBorder: '1px solid rgba(255, 255, 255, 0.08)',
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
      outerBackground: '#f1f5f9',
      cardBackground: '#ffffff',
      cardBackdropFilter: 'none',
      cardBorder: '1px solid #e2e8f0',
      cardShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08)',
      textPrimary: '#0f172a',
      textSecondary: '#64748b',
      promptBg: '#f8fafc',
      promptBorder: '1px solid #e2e8f0',
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
      outerBackground: '#f5efe6',
      cardBackground: '#faf6f0',
      cardBackdropFilter: 'none',
      cardBorder: '1px solid #e7dec8',
      cardShadow: '0 20px 40px -15px rgba(44, 40, 37, 0.08)',
      textPrimary: '#1c1917',
      textSecondary: '#78716c',
      promptBg: 'rgba(120, 113, 108, 0.06)',
      promptBorder: '1px solid rgba(120, 113, 108, 0.14)',
      quoteBg: 'rgba(120, 113, 108, 0.05)',
      quoteBorder: '#d6c7a1',
      codeBg: 'rgba(120, 113, 108, 0.08)',
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
      outerBackground: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)',
      cardBackground: 'rgba(255, 255, 255, 0.18)',
      cardBackdropFilter: 'blur(24px)',
      cardBorder: '1px solid rgba(255, 255, 255, 0.35)',
      cardShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
      textPrimary: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.75)',
      promptBg: 'rgba(255, 255, 255, 0.12)',
      promptBorder: '1px solid rgba(255, 255, 255, 0.25)',
      quoteBg: 'rgba(255, 255, 255, 0.10)',
      quoteBorder: 'rgba(255, 255, 255, 0.70)',
      codeBg: 'rgba(255, 255, 255, 0.18)',
      codeText: '#ffffff',
      tableBorder: 'rgba(255, 255, 255, 0.25)',
      tableHeaderBg: 'rgba(255, 255, 255, 0.15)',
      tableRowEvenBg: 'rgba(255, 255, 255, 0.05)',
      fontFamily: 'sans',
      isDark: true,
    },
  }
};
