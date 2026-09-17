<script setup lang="ts">
import { computed } from 'vue';
import type { PostData } from '@/types/post';
import type { CardRenderOptions, QuickShareTheme } from '@/types/theme';
import { getThemeById } from '@/utils/theme-engine';
import { prepareExcerpt } from '@/utils/excerpt';

const props = defineProps<{
  post: PostData;
  options: CardRenderOptions;
  customThemes?: QuickShareTheme[];
}>();

const currentTheme = computed<QuickShareTheme>(() => {
  return getThemeById(props.options.themeId, props.customThemes);
});

const excerpt = computed(() => prepareExcerpt(
  props.post.contentHtml || '',
  props.post.excerptBeforeHtml || '',
  props.post.excerptAfterHtml || ''
));
const excerptContent = computed(() => props.post.isExcerpt ? excerpt.value.content : props.post.contentHtml);
const excerptBefore = computed(() => excerpt.value.before);
const excerptAfter = computed(() => excerpt.value.after);

// 计算卡片专属 CSS 变量字典
const themeCssVars = computed(() => {
  const theme = currentTheme.value;
  const isSerif = theme.typography.fontFamily === 'serif';
  const isMono = theme.typography.fontFamily === 'mono';

  let resolvedFontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif";
  if (isSerif) {
    resolvedFontFamily = "Charter, 'Songti SC', 'Source Han Serif SC', Georgia, Cambria, 'Times New Roman', serif";
  } else if (isMono) {
    resolvedFontFamily = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  } else if (theme.typography.fontFamily !== 'sans') {
    resolvedFontFamily = theme.typography.fontFamily;
  }

  const baseVars: Record<string, string> = {
    '--qs-outer-bg': theme.ambient.outerBackground,
    '--qs-card-bg': theme.card.background,
    '--qs-card-backdrop-filter': theme.card.backdropFilter || 'none',
    '--qs-card-border': theme.card.border || 'none',
    '--qs-card-shadow': theme.card.shadow,
    '--qs-card-inner-glow': theme.card.innerGlow || 'none',
    '--qs-text-primary': theme.typography.textPrimary,
    '--qs-text-secondary': theme.typography.textSecondary,
    '--qs-text-muted': theme.typography.textMuted || theme.typography.textSecondary,
    '--qs-prompt-bg': theme.components?.promptCard?.background || (theme.ambient.isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'),
    '--qs-prompt-border': theme.components?.promptCard?.border || 'none',
    '--qs-prompt-header-color': theme.components?.promptCard?.headerColor || 'inherit',
    '--qs-prompt-radius': theme.components?.promptCard?.borderRadius || '14px',
    '--qs-quote-bg': theme.components?.quoteBlock?.background || (theme.ambient.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'),
    '--qs-quote-border': theme.components?.quoteBlock?.borderColor || (theme.ambient.isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'),
    '--qs-quote-radius': theme.components?.quoteBlock?.borderRadius || '0 8px 8px 0',
    '--qs-code-bg': theme.components?.codeBlock?.background || (theme.ambient.isDark ? '#141418' : '#f1f5f9'),
    '--qs-code-text': theme.components?.codeBlock?.color || theme.typography.textPrimary,
    '--qs-code-border': theme.components?.codeBlock?.border || 'none',
    '--qs-code-radius': theme.components?.codeBlock?.borderRadius || '8px',
    '--qs-table-border': theme.components?.table?.borderColor || (theme.ambient.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'),
    '--qs-table-header-bg': theme.components?.table?.headerBg || (theme.ambient.isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)'),
    '--qs-table-row-even-bg': theme.components?.table?.rowEvenBg || (theme.ambient.isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)'),
    '--qs-font-family': resolvedFontFamily,
    '--qs-padding': `${props.options.padding}px`,
    '--qs-card-radius': `${props.options.cardRadius}px`,
  };

  // 展开自定义扩展 CSS 变量
  if (theme.customVars) {
    for (const [k, v] of Object.entries(theme.customVars)) {
      baseVars[k] = v;
    }
  }

  return baseVars;
});

const avatarRadiusStyle = computed(() => {
  switch (props.options.authorAvatarRadius) {
    case 'rounded-full':
      return { borderRadius: '9999px' };
    case 'rounded-xl':
      return { borderRadius: '12px' };
    case 'rounded-none':
    default:
      return { borderRadius: '0px' };
  }
});

// 平台显示与 Favicon 规范 (优先使用 theme.components.platformBadge 覆写，无覆写时基于 isDark 自动调配)
const platformConfig = computed(() => {
  const isDark = currentTheme.value.ambient.isDark;
  const customBadge = currentTheme.value.components?.platformBadge;

  const getPlatformBase = () => {
    switch (props.post.platform) {
      case 'zhihu':
        return {
          name: '知乎',
          faviconUrl: 'https://static.zhihu.com/heifetz/favicon.ico',
          style: {
            backgroundColor: isDark ? 'rgba(0, 102, 255, 0.22)' : 'rgba(0, 102, 255, 0.10)',
            color: isDark ? '#60a5fa' : '#0066ff',
          },
        };
      case 'x':
        return {
          name: 'X',
          faviconUrl: 'https://abs.twimg.com/favicons/twitter.3.ico',
          style: {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
            color: isDark ? '#ffffff' : '#0f172a',
          },
        };
      case 'chatgpt':
        return {
          name: 'ChatGPT',
          faviconUrl: 'https://chatgpt.com/favicon.ico',
          style: {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
            color: isDark ? '#ffffff' : '#0f172a',
          },
        };
      case 'gemini':
        return {
          name: 'Gemini',
          faviconUrl: 'https://www.gstatic.com/lamda/images/gemini_sparkle_4g_512_lt_f94943af3be039176192d.png',
          style: {
            backgroundColor: isDark ? 'rgba(26, 115, 232, 0.25)' : 'rgba(26, 115, 232, 0.10)',
            color: isDark ? '#93c5fd' : '#1a73e8',
          },
        };
      case 'weibo':
        return {
          name: '微博',
          faviconUrl: 'https://weibo.com/favicon.ico',
          style: {
            backgroundColor: isDark ? 'rgba(230, 22, 45, 0.22)' : 'rgba(230, 22, 45, 0.10)',
            color: isDark ? '#f87171' : '#e6162d',
          },
        };
      case 'jike':
        return {
          name: '即刻',
          faviconUrl: 'https://web.okjike.com/favicon.ico',
          style: {
            backgroundColor: isDark ? 'rgba(255, 228, 17, 0.25)' : 'rgba(255, 228, 17, 0.20)',
            color: isDark ? '#fef08a' : '#333333',
          },
        };
      default: {
        let hostFavicon = '';
        try {
          const host = new URL(props.post.url).hostname;
          hostFavicon = `https://${host}/favicon.ico`;
        } catch {
          hostFavicon = '';
        }
        return {
          name: '网页',
          faviconUrl: hostFavicon,
          style: {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(100, 116, 139, 0.10)',
            color: isDark ? '#cbd5e1' : '#475569',
          },
        };
      }
    }
  };

  const base = getPlatformBase();
  if (customBadge) {
    return {
      ...base,
      style: {
        ...base.style,
        ...(customBadge.background ? { backgroundColor: customBadge.background } : {}),
        ...(customBadge.color ? { color: customBadge.color } : {}),
        ...(customBadge.border ? { border: customBadge.border } : {}),
        ...(customBadge.borderRadius ? { borderRadius: customBadge.borderRadius } : {}),
      },
    };
  }
  return base;
});

const isAiPlatform = computed(() => props.post.platform === 'chatgpt' || props.post.platform === 'gemini');
</script>

<template>
  <!-- 卡片外层包装容器 (标准 640px 物理排版宽度，外层 100% 直角) -->
  <div
    class="qs-card-wrapper"
    :data-theme="currentTheme.id"
    :class="{ 'has-outer-padding': options.showOuterPadding }"
    :style="themeCssVars"
  >
    <!-- 环境空间弥散光核层 (Ambient Glows) -->
    <div
      v-if="options.showOuterPadding && currentTheme.ambient.glows && currentTheme.ambient.glows.length > 0"
      class="qs-ambient-glows-container"
    >
      <div
        v-for="(glow, gIdx) in currentTheme.ambient.glows"
        :key="gIdx"
        class="qs-ambient-glow-item"
        :style="{
          background: `radial-gradient(ellipse at center, ${glow.color} 0%, transparent 70%)`,
          left: glow.position.split(' ')[0] || '50%',
          top: glow.position.split(' ')[1] || '50%',
          width: glow.size.split(' ')[0] || '400px',
          height: glow.size.split(' ')[1] || glow.size.split(' ')[0] || '300px',
          filter: `blur(${glow.blur || '80px'})`,
          opacity: glow.opacity ?? 0.8,
        }"
      />
    </div>

    <!-- 卡片主体 (圆角、浮起多层立体阴影、物理材质) -->
    <div class="qs-card">
      <!-- 顶部 1px Specular 镜面高光反射光刃 (Apple Liquid Glass / Raycast 硬件质感) -->
      <div
        v-if="currentTheme.card.borderHighlight"
        class="qs-specular-highlight"
        :style="{ background: currentTheme.card.borderHighlight }"
      />

      <!-- Header: 作者信息 & 站点 Favicon 标识 (仅在非 Thread 模式下展示标准 Header，Thread 模式由下方专属连线 Header 渲染) -->
      <div v-if="!post.parentThreadPost" class="qs-card-header">
        <div class="qs-author-box">
          <img
            v-if="post.author.avatarUrl"
            :src="post.author.avatarUrl"
            alt="avatar"
            class="qs-avatar-img"
            :style="avatarRadiusStyle"
            crossorigin="anonymous"
          />
          <div
            v-else
            class="qs-avatar-fallback"
            :style="avatarRadiusStyle"
          >
            {{ post.author.name.slice(0, 1) }}
          </div>

          <div class="qs-author-meta">
            <div class="qs-author-name">
              {{ post.author.name }}
            </div>
            <div
              v-if="post.author.handle"
              class="qs-author-handle"
            >
              {{ post.author.handle }}
            </div>
          </div>
        </div>

        <!-- 平台 Favicon Badge (非 AI 对话平台展示，AI 场景左侧专属头像与品牌已足够) -->
        <div
          v-if="!isAiPlatform"
          class="qs-platform-badge"
          :title="platformConfig.name"
        >
          <img
            v-if="platformConfig.faviconUrl"
            :src="platformConfig.faviconUrl"
            :alt="platformConfig.name"
            class="qs-platform-icon"
            crossorigin="anonymous"
            @error="(e: any) => e.target.style.display = 'none'"
          />
        </div>
      </div>

      <!-- Content 区域 -->
      <!-- A. Thread 连线对话链模式 (主帖/上级回复 + 当前评论) -->
      <div v-if="post.parentThreadPost" class="qs-thread-wrapper">
        <!-- 顶栏平台 Badge -->
        <div v-if="!isAiPlatform" class="qs-thread-top-bar">
          <div class="qs-platform-badge" :title="platformConfig.name">
            <img
              v-if="platformConfig.faviconUrl"
              :src="platformConfig.faviconUrl"
              :alt="platformConfig.name"
              class="qs-platform-icon"
              crossorigin="anonymous"
              @error="(e: any) => e.target.style.display = 'none'"
            />
            </div>
        </div>

        <div class="qs-thread-container">
          <!-- 1. 上级推文 (Parent / Root Tweet) -->
          <div class="qs-thread-item qs-thread-parent">
            <div class="qs-thread-left-col">
              <img
                v-if="post.parentThreadPost.author.avatarUrl"
                :src="post.parentThreadPost.author.avatarUrl"
                alt="avatar"
                class="qs-avatar-img"
                :style="avatarRadiusStyle"
                crossorigin="anonymous"
              />
              <div
                v-else
                class="qs-avatar-fallback"
                :style="avatarRadiusStyle"
              >
                {{ post.parentThreadPost.author.name.slice(0, 1) }}
              </div>
              <!-- 垂直连接线 -->
              <div class="qs-thread-connector-line" />
            </div>

            <div class="qs-thread-right-col">
              <div class="qs-author-meta">
                <div class="qs-author-name">
                  {{ post.parentThreadPost.author.name }}
                </div>
                <div v-if="post.parentThreadPost.author.handle" class="qs-author-handle">
                  {{ post.parentThreadPost.author.handle }}
                </div>
              </div>

              <!-- 上级推文正文 -->
              <div class="qs-thread-body">
                <div
                  v-if="post.parentThreadPost.contentHtml"
                  class="quick-share-rich-body"
                  :style="{
                    fontSize: `${15 * options.fontScale}px`,
                    lineHeight: 1.7,
                  }"
                  v-html="post.parentThreadPost.contentHtml"
                />
                <p
                  v-else
                  class="qs-plain-content"
                  :style="{
                    fontSize: `${15 * options.fontScale}px`,
                    lineHeight: 1.7,
                  }"
                >
                  {{ post.parentThreadPost.content }}
                </p>
              </div>

              <!-- 上级推文配图/媒体 -->
              <div
                v-if="post.parentThreadPost.media && post.parentThreadPost.media.length > 0"
                class="qs-media-gallery"
                style="margin-top: 10px;"
              >
                <div
                  v-for="(item, idx) in post.parentThreadPost.media"
                  :key="idx"
                  class="qs-media-item"
                >
                  <img
                    :src="item.posterUrl || item.url"
                    alt="media"
                    class="qs-media-img"
                    crossorigin="anonymous"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 2. 当前评论推文 (Target Reply Tweet) -->
          <div class="qs-thread-item qs-thread-current">
            <div class="qs-thread-left-col">
              <img
                v-if="post.author.avatarUrl"
                :src="post.author.avatarUrl"
                alt="avatar"
                class="qs-avatar-img"
                :style="avatarRadiusStyle"
                crossorigin="anonymous"
              />
              <div
                v-else
                class="qs-avatar-fallback"
                :style="avatarRadiusStyle"
              >
                {{ post.author.name.slice(0, 1) }}
              </div>
            </div>

            <div class="qs-thread-right-col">
              <div class="qs-author-meta">
                <div class="qs-author-name">
                  {{ post.author.name }}
                </div>
                <div v-if="post.author.handle" class="qs-author-handle">
                  {{ post.author.handle }}
                </div>
              </div>

              <!-- 评论正文 -->
              <div class="qs-thread-body">
                <div
                  v-if="post.contentHtml"
                  class="quick-share-rich-body"
                  :style="{
                    fontSize: `${15 * options.fontScale}px`,
                    lineHeight: 1.7,
                  }"
                  v-html="excerptContent"
                />
                <p
                  v-else
                  class="qs-plain-content"
                  :style="{
                    fontSize: `${15 * options.fontScale}px`,
                    lineHeight: 1.7,
                  }"
                >
                  {{ post.content }}
                </p>
              </div>

              <!-- 评论配图/媒体 -->
              <div
                v-if="post.media && post.media.length > 0"
                class="qs-media-gallery"
                style="margin-top: 10px;"
              >
                <div
                  v-for="(item, idx) in post.media"
                  :key="idx"
                  class="qs-media-item"
                >
                  <img
                    :src="item.posterUrl || item.url"
                    alt="media"
                    class="qs-media-img"
                    crossorigin="anonymous"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- B. 标准单推文/文章模式 -->
      <template v-else>
        <!-- Content: 标题（如有）与正文/图文流 -->
        <div class="qs-card-content">
          <!-- 1. AI 对话场景：用户提问 Prompt -->
          <div
            v-if="isAiPlatform && (post.title || post.promptHtml)"
            class="qs-prompt-container"
          >
            <div
              class="qs-prompt-header"
              :style="{ color: themeCssVars['--qs-prompt-header-color'] }"
            >
              <span class="qs-prompt-dot"></span>
              Prompt
            </div>
            <!-- 富文本 Prompt (支持原样文本、全宽高清图片与文件卡片) -->
            <div
              v-if="post.promptHtml"
              class="quick-share-prompt-body"
              v-html="post.promptHtml"
            />
            <!-- 纯文本 Prompt 兜底 -->
            <div
              v-else
              class="qs-prompt-plain"
            >
              {{ post.title }}
            </div>
          </div>

          <!-- 2. 非 AI 场景：常规文章/帖子标题 -->
          <h3
            v-else-if="post.title"
            class="qs-post-title"
          >
            {{ post.title }}
          </h3>
          
          <!-- 1. 划选摘录模式：保留原 DOM 格式，支持段落内水平渐变 + 段落外垂直渐变 -->
          <div v-if="post.isExcerpt" class="qs-excerpt-wrapper">
            <!-- 上方前置段落（垂直顶部淡出渐显 + 微模糊） -->
            <div
              v-if="excerptBefore"
              class="quick-share-excerpt-top-fade quick-share-rich-body"
              :style="{
                fontSize: `${15 * options.fontScale}px`,
                lineHeight: 1.7,
              }"
            ><div v-html="excerptBefore" /></div>

            <!-- 选中的核心段落（完整保留原生 DOM 格式与自然字号，内含文字水平渐显渐隐） -->
            <div
              class="quick-share-rich-body"
              :style="{
                fontSize: `${15 * options.fontScale}px`,
                lineHeight: 1.7,
              }"
              v-if="excerptContent"
              v-html="excerptContent"
            />

            <p v-else class="qs-plain-content" :style="{ fontSize: `${15 * options.fontScale}px` }">{{ post.content }}</p>

            <!-- 下方后置段落（垂直底部淡出渐隐 + 微模糊） -->
            <div
              v-if="excerptAfter"
              class="quick-share-excerpt-bottom-fade quick-share-rich-body"
              :style="{
                fontSize: `${15 * options.fontScale}px`,
                lineHeight: 1.7,
              }"
            ><div v-html="excerptAfter" /></div>
          </div>

          <!-- 2. 全文分享模式 -->
          <template v-else>
            <!-- 富文本图文混排模式 -->
            <div
              v-if="post.contentHtml"
              class="quick-share-rich-body"
              :style="{
                fontSize: `${15 * options.fontScale}px`,
                lineHeight: 1.7,
              }"
              v-html="excerptContent"
            />

            <!-- 纯文本模式 -->
            <p
              v-else
              class="qs-plain-content"
              :style="{
                fontSize: `${15 * options.fontScale}px`,
                lineHeight: 1.7,
              }"
            >
              {{ post.content }}
            </p>
          </template>
        </div>

        <!-- Media: X / 独立媒体图片/视频 (100% 宽度，高度自动撑高) -->
        <div
          v-if="!post.isExcerpt && post.media && post.media.length > 0"
          class="qs-media-gallery"
        >
          <div
            v-for="(item, idx) in post.media"
            :key="idx"
            class="qs-media-item"
          >
            <div
              v-if="item.type === 'video'"
              class="quick-share-video-container"
            >
              <img
                :src="item.posterUrl || item.url"
                alt="video thumbnail"
                class="qs-media-img"
                crossorigin="anonymous"
              />
              <div class="qs-video-play-badge">
                <svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 ml-0.5">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div
                v-if="item.duration"
                class="qs-video-duration-badge"
              >
                {{ item.duration }}
              </div>
            </div>
            <img
              v-else
              :src="item.url"
              alt="media"
              class="qs-media-img"
              crossorigin="anonymous"
            />
          </div>
        </div>
      </template>

      <!-- Footer: 清洗后 URL 链接 -->
      <div
        v-if="post.url && !isAiPlatform"
        class="qs-card-footer"
      >
        <div class="qs-footer-url">
          {{ post.url }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 卡片外层包装容器 (标准 640px 物理排版宽度，外层 100% 直角) */
.qs-card-wrapper {
  position: relative;
  box-sizing: border-box;
  user-select: text;
  width: 640px;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  background: transparent;
  padding: 0;
  border-radius: 0px !important;
  font-family: var(--qs-font-family);
  color: var(--qs-text-primary);
  overflow: hidden;
}

/* 开启背景边距：外层四个角彻底直角 (border-radius: 0)，填充 48px 主题外层背景衬底 */
.qs-card-wrapper.has-outer-padding {
  background: var(--qs-outer-bg);
  padding: 48px;
  border-radius: 0px !important;
}

/* Raycast Wrapped 材质仅作用于曜石主题，不改变正文结构。 */
.qs-card-wrapper[data-theme='raycast-dark'].has-outer-padding {
  padding: 36px;
}
.qs-card-wrapper[data-theme='raycast-dark'].has-outer-padding::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: .09;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch' seed='12'/%3E%3C/filter%3E%3Cpath fill='%23fff' filter='url(%23grain)' d='M0 0h160v160H0z'/%3E%3C/svg%3E");
  background-size: 160px 160px;
}
.qs-card-wrapper[data-theme='raycast-dark'] .qs-card {
  padding: 28px;
}
.qs-card-wrapper[data-theme='raycast-dark'] .qs-card::after {
  content: '';
  position: absolute;
  left: 12%;
  right: 12%;
  bottom: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #b74b08 22%, #ffc35c 50%, #b74b08 78%, transparent);
  box-shadow: 0 -2px 18px 2px #ed79042b;
  pointer-events: none;
}
.qs-card-wrapper[data-theme='raycast-dark'] .qs-card-header {
  padding-bottom: 22px;
  margin-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, .09);
}
.qs-card-wrapper[data-theme='raycast-dark'] .qs-avatar-fallback {
  background: linear-gradient(145deg, #2d2926, #100f0f);
  border: 1px solid #ffffff20;
  box-shadow: inset 0 1px 1px #ffffff12;
  color: #f1e4d6;
}
.qs-card-wrapper[data-theme='raycast-dark'] .qs-author-handle {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px;
}
.qs-card-wrapper[data-theme='raycast-dark'] .qs-card-footer {
  border-top: 1px solid rgba(255, 255, 255, .09);
  padding-top: 18px;
}

.qs-card-wrapper[data-theme='liquid-glass'].has-outer-padding,
.qs-card-wrapper[data-theme='craft-editorial'].has-outer-padding {
  padding: 32px;
}
.qs-card-wrapper[data-theme='liquid-glass'] .qs-card {
  padding: 30px;
  border-radius: 22px;
}
.qs-card-wrapper[data-theme='craft-editorial'] .qs-card {
  padding: 30px;
  border-radius: 14px;
}
.qs-card-wrapper[data-theme='liquid-glass'] .qs-card-header,
.qs-card-wrapper[data-theme='craft-editorial'] .qs-card-header {
  padding-bottom: 22px;
  margin-bottom: 24px;
  border-bottom: 1px solid rgba(125, 137, 153, .2);
}
.qs-card-wrapper[data-theme='craft-editorial'] .qs-card-header {
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
  border-bottom-color: #ded8ce;
}
.qs-card-wrapper[data-theme='liquid-glass'] .qs-card-footer,
.qs-card-wrapper[data-theme='craft-editorial'] .qs-card-footer {
  padding-top: 20px;
  border-top: 1px solid rgba(125, 137, 153, .22);
}
.qs-card-wrapper[data-theme='craft-editorial']::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  opacity: .035;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch' seed='12'/%3E%3C/filter%3E%3Cpath fill='%23fff' filter='url(%23grain)' d='M0 0h160v160H0z'/%3E%3C/svg%3E");
  background-size: 160px 160px;
}
.qs-card-wrapper[data-theme='craft-editorial'] .qs-footer-url::before {
  content: '';
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 1px;
  margin-right: 9px;
  background: #bd7d70;
}

/* 环境空间弥散光核容器 */
.qs-ambient-glows-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.qs-ambient-glow-item {
  position: absolute;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  pointer-events: none;
}

/* 卡片主体容器 (圆角、浮起多层立体大阴影、内发光、内边距) */
.qs-card {
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: var(--qs-card-bg);
  border: var(--qs-card-border);
  box-shadow: var(--qs-card-shadow), var(--qs-card-inner-glow);
  backdrop-filter: var(--qs-card-backdrop-filter);
  -webkit-backdrop-filter: var(--qs-card-backdrop-filter);
  border-radius: var(--qs-card-radius);
  padding: var(--qs-padding);
  color: var(--qs-text-primary);
  z-index: 1;
}

/* 顶部 1px Specular 镜面高光光刃 */
.qs-specular-highlight {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  pointer-events: none;
  z-index: 2;
}

/* Header */
.qs-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
  width: 100%;
}

.qs-author-box {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.qs-avatar-img {
  width: 44px;
  height: 44px;
  object-fit: cover;
  flex-shrink: 0;
  box-shadow: none;
  border: none;
  background: transparent;
}

.qs-avatar-fallback {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #0284c7;
  color: #ffffff;
  font-weight: 700;
  font-size: 18px;
}

.qs-author-meta {
  min-width: 0;
  flex: 1;
}

.qs-author-name {
  font-weight: 700;
  font-size: 16px;
  line-height: 1.35;
  color: var(--qs-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qs-author-handle {
  font-size: 12px;
  color: var(--qs-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
  opacity: 0.85;
}

/* 平台 Badge */
.qs-platform-badge {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qs-platform-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

/* Content */
.qs-card-content {
  margin-bottom: 24px;
  width: 100%;
  word-break: break-word;
}

.qs-post-title {
  font-weight: 800;
  font-size: 20px;
  line-height: 1.35;
  letter-spacing: -0.015em;
  margin-top: 0;
  margin-bottom: 16px;
  color: var(--qs-text-primary);
  word-break: break-word;
}

/* AI Prompt 区域 */
.qs-prompt-container {
  margin-bottom: 24px;
  width: 100%;
  border-radius: var(--qs-prompt-radius);
  padding: 16px;
  background: var(--qs-prompt-bg);
  border: var(--qs-prompt-border);
  box-sizing: border-box;
}

.qs-prompt-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--qs-prompt-header-color);
  margin-bottom: 6px;
}

.qs-prompt-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
  opacity: 0.8;
}

.qs-prompt-plain {
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1.6;
  color: var(--qs-text-primary);
  word-break: break-word;
}

.qs-plain-content {
  white-space: pre-wrap;
  line-height: 1.7;
  font-size: 15px;
  color: var(--qs-text-primary);
  word-break: break-word;
  margin: 0;
}

/* 划选 Excerpt 上下文 */
.qs-excerpt-wrapper {
  width: 100%;
}

.quick-share-excerpt-top-fade {
  max-height: 3.4em;
  white-space: pre-line;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  opacity: 0.32;
  filter: blur(0.35px);
  position: relative;
  mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.45) 40%,
    rgba(0, 0, 0, 1) 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.45) 40%,
    rgba(0, 0, 0, 1) 100%
  );
  margin-bottom: 6px;
  user-select: none;
  pointer-events: none;
}

.quick-share-excerpt-bottom-fade {
  max-height: 3.4em;
  white-space: pre-line;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  opacity: 0.35;
  filter: blur(0.35px);
  position: relative;
  mask-image: linear-gradient(
    to top,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.45) 40%,
    rgba(0, 0, 0, 1) 100%
  );
  -webkit-mask-image: linear-gradient(
    to top,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.45) 40%,
    rgba(0, 0, 0, 1) 100%
  );
  margin-top: 6px;
  user-select: none;
  pointer-events: none;
}

.quick-share-excerpt-top-fade > :deep(*),
.quick-share-excerpt-bottom-fade > :deep(*) {
  flex-shrink: 0;
  margin-top: 0;
  margin-bottom: 0;
}

/* 段落内部：前置文字水平淡入渐显与微模糊 */
:deep(.quick-share-inline-fade-in) {
  display: inline;
  opacity: 0.4;
  filter: blur(0.4px);
  background: linear-gradient(to right, transparent 0%, var(--qs-text-primary) 95%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 段落内部：选中的核心文字，100% 锐利高亮 */
:deep(.quick-share-spotlight) {
  display: inline;
  opacity: 1;
  filter: none;
  color: var(--qs-text-primary);
}

/* 段落内部：后置文字水平淡出渐隐与微模糊 */
:deep(.quick-share-inline-fade-out) {
  display: inline;
  opacity: 0.4;
  filter: blur(0.4px);
  background: linear-gradient(to right, var(--qs-text-primary) 5%, transparent 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 忽略上下文中的多余图片与按钮以维持纯净书摘质感，并防御空列表项导致的孤立圆点 */
:deep(.quick-share-excerpt-top-fade img),
:deep(.quick-share-excerpt-bottom-fade img),
:deep(.quick-share-excerpt-top-fade button),
:deep(.quick-share-excerpt-bottom-fade button),
:deep(.quick-share-excerpt-top-fade li:empty),
:deep(.quick-share-excerpt-bottom-fade li:empty),
:deep(.quick-share-excerpt-top-fade ul:empty),
:deep(.quick-share-excerpt-bottom-fade ul:empty),
:deep(.quick-share-excerpt-top-fade ol:empty),
:deep(.quick-share-excerpt-bottom-fade ol:empty),
:deep(.quick-share-excerpt-top-fade p:empty),
:deep(.quick-share-excerpt-bottom-fade p:empty),
:deep(.cdk-visually-hidden),
:deep(.visually-hidden),
:deep(.sr-only),
:deep([class*="visually-hidden"]),
:deep([class*="screen-reader"]),
:deep(.model-response-header),
:deep([class*="model-response-header"]) {
  display: none !important;
}

/* 富文本容器：统一字色与继承重置 */
.quick-share-rich-body {
  color: var(--qs-text-primary);
  line-height: 1.7;
  word-break: break-word;
}

:deep(.quick-share-rich-body) {
  color: var(--qs-text-primary);
}

:deep(.quick-share-rich-body *) {
  color: inherit;
}

:deep(.quick-share-rich-body p) {
  margin-top: 0;
  margin-bottom: 0.85em;
  word-break: break-word;
}

:deep(.quick-share-rich-body blockquote) {
  padding: 10px 16px;
  margin-top: 14px;
  margin-bottom: 14px;
  border-left: 3.5px solid var(--qs-quote-border);
  background-color: var(--qs-quote-bg);
  border-radius: var(--qs-quote-radius);
  opacity: 0.95;
}

:deep(.quick-share-rich-body blockquote p:last-child) {
  margin-bottom: 0;
}

/* X (Twitter) 转发原帖引用卡片 (Quote Tweet Box) */
:deep(.quick-share-quote-tweet) {
  margin-top: 14px;
  border-radius: 14px;
  border: 1px solid var(--qs-table-border, rgba(255, 255, 255, 0.12));
  background: var(--qs-prompt-bg, rgba(255, 255, 255, 0.04));
  padding: 12px 14px;
  box-sizing: border-box;
  width: 100%;
}

:deep(.quick-share-quote-header) {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 13px;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.quick-share-quote-avatar) {
  width: 20px;
  height: 20px;
  border-radius: 9999px;
  object-fit: cover;
  flex-shrink: 0;
}

:deep(.quick-share-quote-name) {
  font-weight: 700;
  font-size: 13.5px;
  color: var(--qs-text-primary);
  flex-shrink: 0;
}

:deep(.quick-share-quote-handle) {
  font-size: 12px;
  color: var(--qs-text-secondary);
  opacity: 0.85;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.quick-share-quote-time) {
  font-size: 12px;
  color: var(--qs-text-secondary);
  opacity: 0.75;
  flex-shrink: 0;
}

:deep(.quick-share-quote-text) {
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--qs-text-primary);
  word-break: break-word;
  margin-top: 4px;
}

:deep(.quick-share-quote-text p) {
  margin: 0;
}

:deep(.quick-share-quote-media-grid) {
  display: grid;
  gap: 6px;
  margin-top: 10px;
  width: 100%;
  border-radius: 10px;
  overflow: hidden;
}

:deep(.quick-share-quote-media-grid.grid-cols-1) {
  grid-template-columns: 1fr;
}

:deep(.quick-share-quote-media-grid.grid-cols-2) {
  grid-template-columns: repeat(2, 1fr);
}

:deep(.quick-share-quote-img) {
  width: 100%;
  height: auto;
  max-height: 280px;
  object-fit: cover;
  border-radius: 8px;
  display: block;
}

:deep(.quick-share-rich-body .quick-share-rich-img) {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
  object-fit: contain;
  border-radius: 12px;
  margin: 14px auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

:deep(.quick-share-rich-body ul) {
  list-style-type: disc;
  padding-left: 1.5em;
  margin: 0.8em 0;
}

:deep(.quick-share-rich-body ol) {
  list-style-type: decimal;
  padding-left: 1.5em;
  margin: 0.8em 0;
}

:deep(.quick-share-rich-body li) {
  margin-bottom: 0.45em;
}

:deep(.quick-share-rich-body li > p) {
  margin-bottom: 0.35em;
}

:deep(.quick-share-rich-body h1),
:deep(.quick-share-rich-body h2),
:deep(.quick-share-rich-body h3) {
  font-weight: 700;
  margin-top: 1.2em;
  margin-bottom: 0.5em;
  color: var(--qs-text-primary);
}

:deep(.quick-share-rich-body a) {
  color: var(--qs-text-primary);
  text-decoration: underline;
  text-underline-offset: 3px;
  opacity: 0.85;
}

:deep(.quick-share-rich-body pre),
:deep(.quick-share-rich-body code),
:deep(.quick-share-rich-body code-block),
:deep(.quick-share-rich-body [class*="code-block"]),
:deep(.quick-share-rich-body [class*="code-container"]) {
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

:deep(.quick-share-rich-body pre),
:deep(.quick-share-rich-body code-block),
:deep(.quick-share-rich-body [class*="code-block"]) {
  background-color: var(--qs-code-bg);
  color: var(--qs-code-text);
  border: var(--qs-code-border);
  border-radius: var(--qs-code-radius);
  padding: 12px 14px;
  margin: 12px 0;
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden !important;
  white-space: pre-wrap !important;
  word-break: break-all !important;
  overflow-wrap: anywhere !important;
  word-wrap: break-word !important;
}

:deep(.quick-share-rich-body pre *),
:deep(.quick-share-rich-body pre code),
:deep(.quick-share-rich-body code-block *),
:deep(.quick-share-rich-body [class*="code-block"] *) {
  white-space: pre-wrap !important;
  word-break: break-all !important;
  overflow-wrap: anywhere !important;
  word-wrap: break-word !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

/* 行内普通 code 标签 (非 pre 内部) */
:deep(.quick-share-rich-body :not(pre) > code),
:deep(.quick-share-rich-body p code),
:deep(.quick-share-rich-body li code) {
  background-color: var(--qs-code-bg);
  color: var(--qs-code-text);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.9em;
  white-space: pre-wrap !important;
  word-break: break-all !important;
  overflow-wrap: anywhere !important;
}

/* 表格排版与边框美化 */
:deep(.quick-share-rich-body table) {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 14px 0;
  font-size: 0.88em;
  line-height: 1.55;
  border: 1px solid var(--qs-table-border);
  border-radius: 8px;
  overflow: hidden;
}

:deep(.quick-share-rich-body th),
:deep(.quick-share-rich-body td) {
  border-right: 1px solid var(--qs-table-border);
  border-bottom: 1px solid var(--qs-table-border);
  padding: 8px 12px;
  text-align: left;
}

:deep(.quick-share-rich-body th:last-child),
:deep(.quick-share-rich-body td:last-child) {
  border-right: none;
}

:deep(.quick-share-rich-body tr:last-child td) {
  border-bottom: none;
}

:deep(.quick-share-rich-body th) {
  background-color: var(--qs-table-header-bg);
  font-weight: 700;
}

:deep(.quick-share-rich-body tr:nth-child(even)) {
  background-color: var(--qs-table-row-even-bg);
}

/* Prompt 内部富文本与图片附件 */
.quick-share-prompt-body {
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1.6;
  color: var(--qs-text-primary);
  word-break: break-word;
}

:deep(.quick-share-prompt-body) {
  color: var(--qs-text-primary);
}

:deep(.quick-share-prompt-body *) {
  color: inherit;
}

:deep(.quick-share-prompt-body p) {
  margin-bottom: 0.5em;
}

:deep(.quick-share-prompt-body p:last-child) {
  margin-bottom: 0;
}

:deep(.quick-share-prompt-body .quick-share-prompt-img),
:deep(.quick-share-prompt-body img) {
  display: block;
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
  max-height: none !important;
  object-fit: contain !important;
  border-radius: 12px;
  margin-top: 10px;
  margin-bottom: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

:deep(.quick-share-prompt-body .quick-share-prompt-file-chip),
:deep(.quick-share-prompt-body mat-card),
:deep(.quick-share-prompt-body [class*="file-preview"]),
:deep(.quick-share-prompt-body [class*="attachment-preview"]),
:deep(.quick-share-prompt-body [class*="file-chip"]) {
  display: flex !important;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  margin-top: 10px;
  margin-bottom: 6px;
  border-radius: 12px;
  background-color: var(--qs-code-bg);
  border: 1px solid var(--qs-prompt-border);
  font-size: 13px;
  font-weight: 500;
  width: 100%;
  box-sizing: border-box;
}

:deep(.quick-share-prompt-body [class*="file-icon"]),
:deep(.quick-share-prompt-body mat-icon) {
  font-size: 20px;
  width: 20px;
  height: 20px;
  opacity: 0.85;
}

/* Media 区域 (推文配图等) */
.qs-media-gallery {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
}

.qs-media-item {
  width: 100%;
  background-color: rgba(0, 0, 0, 0.04);
  border-radius: 12px;
  overflow: hidden;
}

.qs-media-img {
  width: 100%;
  height: auto;
  object-fit: contain;
  border-radius: 12px;
  display: block;
  margin: 0 auto;
}

/* 视频容器与播放微标 / 时长胶囊 */
.quick-share-video-container {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 12px;
}

:deep(.quick-share-video-container) {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 8px;
}

.qs-video-play-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 52px;
  height: 52px;
  background-color: rgba(15, 20, 25, 0.75);
  backdrop-filter: blur(6px);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  pointer-events: none;
}

:deep(.qs-video-play-badge) {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 44px;
  height: 44px;
  background-color: rgba(15, 20, 25, 0.75);
  backdrop-filter: blur(4px);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  pointer-events: none;
}

.qs-video-duration-badge {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: rgba(15, 20, 25, 0.8);
  backdrop-filter: blur(4px);
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 7px;
  border-radius: 5px;
  letter-spacing: 0.02em;
  pointer-events: none;
}

:deep(.qs-video-duration-badge) {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(15, 20, 25, 0.8);
  backdrop-filter: blur(4px);
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.02em;
  pointer-events: none;
}

/* Thread 对话链连线布局 */
.qs-thread-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.qs-thread-top-bar {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-bottom: 2px;
}

.qs-thread-container {
  display: flex;
  flex-direction: column;
  gap: 0px;
  width: 100%;
}

.qs-thread-item {
  display: flex;
  flex-direction: row;
  gap: 12px;
  position: relative;
  width: 100%;
}

.qs-thread-parent {
  padding-bottom: 18px;
}

.qs-thread-current {
  padding-top: 2px;
}

.qs-thread-left-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 44px;
}

.qs-thread-connector-line {
  width: 2px;
  flex: 1;
  min-height: 28px;
  margin-top: 6px;
  margin-bottom: -2px;
  background-color: var(--qs-text-muted);
  opacity: 0.28;
  border-radius: 9999px;
}

.qs-thread-right-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.qs-thread-body {
  margin-top: 6px;
}

/* Footer */
.qs-card-footer {
  padding-top: 10px;
  display: flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
}

.qs-footer-url {
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11.5px;
  line-height: 1.4;
  color: var(--qs-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  opacity: 0.85;
  user-select: all;
  letter-spacing: -0.01em;
}
</style>
