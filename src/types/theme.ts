export type CardThemeId = 
  | 'modern-dark' 
  | 'modern-light' 
  | 'gradient-sunset' 
  | 'gradient-ocean' 
  | 'gradient-nord' 
  | 'paper-warm' 
  | 'card-glass';

export interface CardThemeConfig {
  id: CardThemeId;
  name: string;
  backgroundClass: string;
  cardClass: string;
  textClass: string;
  subtextClass: string;
  borderClass: string;
  fontFamily: 'sans' | 'serif';
  showPattern?: boolean;
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
    backgroundClass: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600',
    cardClass: 'bg-white/95 backdrop-blur-md shadow-2xl text-slate-800',
    textClass: 'text-slate-900',
    subtextClass: 'text-slate-500',
    borderClass: 'border border-white/40',
    fontFamily: 'sans',
  },
  'gradient-ocean': {
    id: 'gradient-ocean',
    name: '蔚蓝深海 (Ocean)',
    backgroundClass: 'bg-gradient-to-tr from-sky-400 via-blue-600 to-indigo-900',
    cardClass: 'bg-slate-900/90 backdrop-blur-md shadow-2xl text-slate-100',
    textClass: 'text-white',
    subtextClass: 'text-slate-400',
    borderClass: 'border border-slate-700/60',
    fontFamily: 'sans',
  },
  'gradient-nord': {
    id: 'gradient-nord',
    name: '极光冷调 (Nord)',
    backgroundClass: 'bg-gradient-to-br from-emerald-400 via-teal-600 to-cyan-800',
    cardClass: 'bg-slate-900/95 backdrop-blur-md shadow-2xl text-slate-100',
    textClass: 'text-slate-100',
    subtextClass: 'text-emerald-300/80',
    borderClass: 'border border-emerald-500/20',
    fontFamily: 'sans',
  },
  'modern-dark': {
    id: 'modern-dark',
    name: '曜石深黑 (Dark)',
    backgroundClass: 'bg-zinc-950',
    cardClass: 'bg-zinc-900 shadow-2xl text-zinc-100',
    textClass: 'text-zinc-50',
    subtextClass: 'text-zinc-400',
    borderClass: 'border border-zinc-800',
    fontFamily: 'sans',
  },
  'modern-light': {
    id: 'modern-light',
    name: '纯净极简 (Light)',
    backgroundClass: 'bg-slate-100',
    cardClass: 'bg-white shadow-xl text-slate-800',
    textClass: 'text-slate-900',
    subtextClass: 'text-slate-500',
    borderClass: 'border border-slate-200/80',
    fontFamily: 'sans',
  },
  'paper-warm': {
    id: 'paper-warm',
    name: '暖雅宣纸 (Warm Paper)',
    backgroundClass: 'bg-[#f5efe6]',
    cardClass: 'bg-[#faf6f0] shadow-xl text-[#2c2825]',
    textClass: 'text-[#1c1917]',
    subtextClass: 'text-[#78716c]',
    borderClass: 'border border-[#e7dec8]',
    fontFamily: 'serif',
  },
  'card-glass': {
    id: 'card-glass',
    name: '毛玻璃 (Glassmorphism)',
    backgroundClass: 'bg-gradient-to-tr from-violet-600 via-indigo-600 to-blue-500',
    cardClass: 'bg-white/20 backdrop-blur-xl shadow-2xl text-white',
    textClass: 'text-white',
    subtextClass: 'text-white/70',
    borderClass: 'border border-white/30',
    fontFamily: 'sans',
  }
};
