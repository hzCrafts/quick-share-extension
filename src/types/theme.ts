export type BuiltinCardThemeId =
  | 'raycast-dark'
  | 'liquid-glass'
  | 'craft-editorial'
  | 'gradient-sunset'
  | 'gradient-ocean';

export type CardThemeId = BuiltinCardThemeId | (string & {});

/**
 * 环境弥散光核配置 (用于 Raycast 破晓光晕 / Apple 流动光斑)
 */
export interface AmbientGlow {
  color: string;
  position: string; // e.g. '50% 100%', 'bottom center', 'top right'
  size: string; // e.g. '500px 240px', '70% 50%'
  blur?: string; // e.g. '80px'
  opacity?: number; // 0.0 ~ 1.0
}

/**
 * 解耦的高自由度卡片主题架构
 */
export interface QuickShareTheme {
  $schema?: string;
  version: 1; // 语义化版本号，用于向后兼容与迁移
  id: CardThemeId;
  name: string;
  author?: string;
  description?: string;
  previewColor: string; // 在主题选择器中展示的色块或渐变

  // 1. 环境底色与多层空间弥散光斑 (Ambient & Light Field)
  ambient: {
    isDark: boolean;
    outerBackground: string; // 外部衬底背景 (纯色、线性渐变、径向渐变或 Mesh)
    glows?: AmbientGlow[]; // 空间多重弥散光核 (Raycast破晓光晕 / Apple流体光斑)
    noiseOpacity?: number; // 磨砂微噪点强度 (0 ~ 1)
  };

  // 2. 卡片容器材质与光学高光 (Surface & Specular Highlights)
  card: {
    background: string; // 纯色、半透明 RGBA、多重微渐变
    backdropFilter?: string; // 毛玻璃滤镜，如 'blur(24px) saturate(180%)'
    border?: string; // 基础边框
    borderHighlight?: string; // 顶部 1px 镜面反光光刃 (linear-gradient)
    shadow: string; // 多层物理立体投影
    innerGlow?: string; // 内发光微雕倒角 (inset box-shadow)
  };

  // 3. 字体与排版体系 (Typography)
  typography: {
    fontFamily: 'sans' | 'serif' | 'mono' | string;
    textPrimary: string;
    textSecondary: string;
    textMuted?: string;
    headingFontFamily?: string;
    codeFontFamily?: string;
  };

  // 4. 组件级独立样式覆写 (Component-level Overrides)
  components?: {
    platformBadge?: {
      background?: string;
      color?: string;
      border?: string;
      borderRadius?: string;
    };
    promptCard?: {
      background?: string;
      border?: string;
      borderRadius?: string;
      headerColor?: string;
    };
    quoteBlock?: {
      background?: string;
      borderColor?: string;
      borderWidth?: string;
      borderRadius?: string;
    };
    codeBlock?: {
      background?: string;
      color?: string;
      border?: string;
      borderRadius?: string;
    };
    table?: {
      borderColor?: string;
      headerBg?: string;
      rowEvenBg?: string;
    };
    footer?: {
      textColor?: string;
      borderTop?: string;
    };
  };

  // 5. 极限扩展：自由 CSS 变量与覆盖
  customVars?: Record<string, string>;
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

/**
 * 5 款全新打造的顶级旗舰预设主题
 */
export const BUILTIN_THEMES: Record<BuiltinCardThemeId, QuickShareTheme> = {
  // 1. Raycast 曜石微光 (Tactical Dark & Bento Glow)
  'raycast-dark': {
    version: 1,
    id: 'raycast-dark',
    name: 'Raycast 曜石 (Bento Glow)',
    author: 'QuickShare',
    description: '冷曜石深黑微渐变 + 底部琥珀破晓光晕 + 1px 精密内发光微边框',
    previewColor: 'linear-gradient(135deg, #09090b 0%, #18181b 60%, #ea580c 100%)',
    ambient: {
      isDark: true,
      outerBackground: 'linear-gradient(180deg, #09090b 0%, #0c0a09 65%, #18120c 100%)',
      glows: [
        {
          color: 'rgba(249, 115, 22, 0.42)', // 暖琥珀破晓光晕
          position: '50% 105%',
          size: '540px 240px',
          blur: '85px',
          opacity: 0.9,
        },
        {
          color: 'rgba(234, 88, 12, 0.20)',
          position: '50% 90%',
          size: '360px 160px',
          blur: '50px',
          opacity: 0.8,
        },
      ],
    },
    card: {
      background: 'linear-gradient(180deg, rgba(24, 24, 27, 0.92) 0%, rgba(15, 15, 18, 0.96) 100%)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.10)',
      borderHighlight: 'linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.02) 100%)',
      shadow: '0 36px 80px -16px rgba(0, 0, 0, 0.95), 0 16px 36px -8px rgba(0, 0, 0, 0.75), 0 0 1px rgba(255, 255, 255, 0.18)',
      innerGlow: 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.14), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.40)',
    },
    typography: {
      fontFamily: 'sans',
      textPrimary: '#f4f4f5',
      textSecondary: '#a1a1aa',
      textMuted: '#71717a',
    },
    components: {
      platformBadge: {
        background: 'rgba(255, 255, 255, 0.08)',
        color: '#f4f4f5',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '9999px',
      },
      promptCard: {
        background: 'linear-gradient(180deg, rgba(39, 39, 42, 0.70) 0%, rgba(24, 24, 27, 0.80) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.09)',
        borderRadius: '14px',
        headerColor: '#fb923c',
      },
      quoteBlock: {
        background: 'rgba(249, 115, 22, 0.06)',
        borderColor: '#f97316',
        borderRadius: '0 8px 8px 0',
      },
      codeBlock: {
        background: '#0d0d11',
        color: '#f4f4f5',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '8px',
      },
      table: {
        borderColor: 'rgba(255, 255, 255, 0.12)',
        headerBg: 'rgba(255, 255, 255, 0.06)',
        rowEvenBg: 'rgba(255, 255, 255, 0.02)',
      },
    },
  },

  // 2. Apple 液态透镜 (Refractive Fluid Glassmorphism)
  'liquid-glass': {
    version: 1,
    id: 'liquid-glass',
    name: 'Apple 液态玻璃 (Liquid Glass)',
    author: 'QuickShare',
    description: '纯正 Vision Pro 光学透镜 + 冰川透蓝与流光靛蓝弥散深空 + 顶部 Specular 镜面反射光刃',
    previewColor: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #38bdf8 100%)',
    ambient: {
      isDark: true,
      outerBackground: 'linear-gradient(135deg, #090d16 0%, #0f172a 45%, #182234 100%)',
      glows: [
        {
          color: 'rgba(56, 189, 248, 0.28)', // 冰川透蓝弥散光核
          position: '85% 15%',
          size: '480px 300px',
          blur: '90px',
          opacity: 0.85,
        },
        {
          color: 'rgba(99, 102, 241, 0.26)', // 流光靛蓝弥散光核
          position: '15% 85%',
          size: '460px 320px',
          blur: '95px',
          opacity: 0.85,
        },
      ],
    },
    card: {
      background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 60%, rgba(255, 255, 255, 0.08) 100%)',
      backdropFilter: 'blur(30px) saturate(190%)',
      border: '1px solid rgba(255, 255, 255, 0.16)',
      borderHighlight: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.65) 35%, rgba(255,255,255,0.08) 100%)',
      shadow: '0 36px 80px -16px rgba(0, 0, 0, 0.85), 0 16px 36px -8px rgba(56, 189, 248, 0.18), 0 0 1px rgba(255, 255, 255, 0.25)',
      innerGlow: 'inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.30), inset 0 0 20px 0 rgba(255, 255, 255, 0.02)',
    },
    typography: {
      fontFamily: 'sans',
      textPrimary: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.78)',
      textMuted: 'rgba(255, 255, 255, 0.52)',
    },
    components: {
      platformBadge: {
        background: 'rgba(255, 255, 255, 0.10)',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.20)',
        borderRadius: '9999px',
      },
      promptCard: {
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        headerColor: '#38bdf8',
      },
      quoteBlock: {
        background: 'rgba(56, 189, 248, 0.06)',
        borderColor: '#38bdf8',
        borderRadius: '0 10px 10px 0',
      },
      codeBlock: {
        background: 'rgba(11, 17, 32, 0.75)',
        color: '#f8fafc',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '8px',
      },
      table: {
        borderColor: 'rgba(255, 255, 255, 0.16)',
        headerBg: 'rgba(255, 255, 255, 0.08)',
        rowEvenBg: 'rgba(255, 255, 255, 0.03)',
      },
    },
  },

  // 3. Craft 暖雅杂志 (Modern Editorial & Tactile Warmth)
  'craft-editorial': {
    version: 1,
    id: 'craft-editorial',
    name: 'Craft 暖雅杂志 (Editorial)',
    author: 'QuickShare',
    description: '温润燕麦与特种羊皮纸色阶 + 经典优雅衬线 + 杂志级多层暖漫反射投影',
    previewColor: 'linear-gradient(135deg, #f5efe6 0%, #e7dec8 50%, #d4a373 100%)',
    ambient: {
      isDark: false,
      outerBackground: 'linear-gradient(135deg, #f7f3ec 0%, #ece3d2 50%, #e2d4be 100%)',
      glows: [
        {
          color: 'rgba(212, 163, 115, 0.28)', // 柔暖燕麦茶光斑
          position: '90% 15%',
          size: '460px 280px',
          blur: '80px',
          opacity: 0.7,
        },
        {
          color: 'rgba(254, 250, 224, 0.60)',
          position: '10% 85%',
          size: '400px 300px',
          blur: '70px',
          opacity: 0.8,
        },
      ],
    },
    card: {
      background: 'linear-gradient(180deg, #fdfbf7 0%, #faf6ee 100%)',
      border: '1px solid rgba(180, 160, 130, 0.25)',
      borderHighlight: 'linear-gradient(90deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.4) 100%)',
      shadow: '0 32px 64px -16px rgba(68, 51, 34, 0.14), 0 14px 28px -8px rgba(68, 51, 34, 0.08), 0 0 1px rgba(68, 51, 34, 0.12)',
      innerGlow: 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.90)',
    },
    typography: {
      fontFamily: 'serif',
      textPrimary: '#292524',
      textSecondary: '#78716c',
      textMuted: '#a8a29e',
    },
    components: {
      platformBadge: {
        background: 'rgba(120, 113, 108, 0.09)',
        color: '#44403c',
        border: '1px solid rgba(120, 113, 108, 0.16)',
        borderRadius: '8px',
      },
      promptCard: {
        background: 'rgba(231, 222, 200, 0.40)',
        border: '1px solid rgba(180, 160, 130, 0.30)',
        borderRadius: '12px',
        headerColor: '#8c6d48',
      },
      quoteBlock: {
        background: 'rgba(214, 199, 161, 0.18)',
        borderColor: '#b08968',
        borderRadius: '0 6px 6px 0',
      },
      codeBlock: {
        background: '#ece5d8',
        color: '#292524',
        border: '1px solid rgba(180, 160, 130, 0.35)',
        borderRadius: '6px',
      },
      table: {
        borderColor: 'rgba(180, 160, 130, 0.35)',
        headerBg: 'rgba(231, 222, 200, 0.50)',
        rowEvenBg: 'rgba(245, 239, 230, 0.40)',
      },
    },
  },

  // 4. 落日余晖 (Classic Radiant Sunset)
  'gradient-sunset': {
    version: 1,
    id: 'gradient-sunset',
    name: '落日余晖 (Radiant Sunset)',
    author: 'QuickShare',
    description: '晨曦暖橙柔光渐变 + 悬浮纯净白岛卡片 + 柔和暖色外投影',
    previewColor: 'linear-gradient(135deg, #ffedd5 0%, #fee2e2 50%, #f43f5e 100%)',
    ambient: {
      isDark: false,
      outerBackground: 'linear-gradient(135deg, #fff1e6 0%, #ffe4e6 50%, #f1f5f9 100%)',
      glows: [
        {
          color: 'rgba(244, 63, 94, 0.25)',
          position: '80% 20%',
          size: '450px 300px',
          blur: '80px',
          opacity: 0.7,
        },
      ],
    },
    card: {
      background: '#ffffff',
      border: '1px solid rgba(244, 63, 94, 0.10)',
      borderHighlight: 'linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.3) 100%)',
      shadow: '0 32px 64px -16px rgba(244, 63, 94, 0.22), 0 16px 32px -8px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.06)',
      innerGlow: 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.8)',
    },
    typography: {
      fontFamily: 'sans',
      textPrimary: '#0f172a',
      textSecondary: '#64748b',
      textMuted: '#94a3b8',
    },
    components: {
      platformBadge: {
        background: 'rgba(244, 63, 94, 0.08)',
        color: '#e11d48',
        border: '1px solid rgba(244, 63, 94, 0.18)',
        borderRadius: '9999px',
      },
      promptCard: {
        background: 'rgba(244, 63, 94, 0.04)',
        border: '1px solid rgba(244, 63, 94, 0.12)',
        borderRadius: '14px',
        headerColor: '#f43f5e',
      },
      quoteBlock: {
        background: 'rgba(244, 63, 94, 0.04)',
        borderColor: '#f43f5e',
        borderRadius: '0 8px 8px 0',
      },
      codeBlock: {
        background: '#f8fafc',
        color: '#0f172a',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
      },
      table: {
        borderColor: '#e2e8f0',
        headerBg: '#f8fafc',
        rowEvenBg: '#f1f5f9',
      },
    },
  },

  // 5. 蔚蓝深海 (Classic Cyber Ocean)
  'gradient-ocean': {
    version: 1,
    id: 'gradient-ocean',
    name: '蔚蓝深海 (Cyber Ocean)',
    author: 'QuickShare',
    description: '幽深深海渐变 + 冰蓝冷光反射 + 科技感深蓝卡片',
    previewColor: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #38bdf8 100%)',
    ambient: {
      isDark: true,
      outerBackground: 'linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e293b 100%)',
      glows: [
        {
          color: 'rgba(56, 189, 248, 0.30)',
          position: '50% 0%',
          size: '520px 240px',
          blur: '80px',
          opacity: 0.8,
        },
      ],
    },
    card: {
      background: 'linear-gradient(180deg, #1e293b 0%, #151e2e 100%)',
      border: '1px solid rgba(56, 189, 248, 0.18)',
      borderHighlight: 'linear-gradient(90deg, rgba(56, 189, 248, 0.1) 0%, rgba(56, 189, 248, 0.5) 50%, rgba(56, 189, 248, 0.1) 100%)',
      shadow: '0 36px 72px -16px rgba(0, 0, 0, 0.90), 0 16px 36px -8px rgba(37, 99, 235, 0.35), 0 0 1px rgba(255, 255, 255, 0.15)',
      innerGlow: 'inset 0 1px 1px 0 rgba(56, 189, 248, 0.25)',
    },
    typography: {
      fontFamily: 'sans',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
    },
    components: {
      platformBadge: {
        background: 'rgba(56, 189, 248, 0.12)',
        color: '#38bdf8',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '9999px',
      },
      promptCard: {
        background: 'rgba(56, 189, 248, 0.06)',
        border: '1px solid rgba(56, 189, 248, 0.15)',
        borderRadius: '14px',
        headerColor: '#38bdf8',
      },
      quoteBlock: {
        background: 'rgba(56, 189, 248, 0.06)',
        borderColor: '#38bdf8',
        borderRadius: '0 8px 8px 0',
      },
      codeBlock: {
        background: '#0b1120',
        color: '#f8fafc',
        border: '1px solid rgba(56, 189, 248, 0.15)',
        borderRadius: '8px',
      },
      table: {
        borderColor: 'rgba(255, 255, 255, 0.10)',
        headerBg: 'rgba(255, 255, 255, 0.06)',
        rowEvenBg: 'rgba(255, 255, 255, 0.02)',
      },
    },
  },
};

/**
 * 保持兼容旧调用的 PRESET_THEMES 引用
 */
export const PRESET_THEMES = BUILTIN_THEMES;
