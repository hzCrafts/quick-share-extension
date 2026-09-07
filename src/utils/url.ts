/**
 * 清洗 URL，移除各类追踪参数与冗余 query 参数，保留最核心的规范化链接
 */
export function cleanShareUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  try {
    const url = new URL(rawUrl);

    // 常见追踪与分享无关参数黑名单
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'share_token',
      'share_source',
      's_ch',
      's_hash',
      's_share',
      's_campaign',
      's_gid',
      'from',
      'ref',
      'ref_src',
      'ref_url',
      'feature',
      't', // 部分时间戳或 tracking
      'fbclid',
      'gclid',
    ];

    // 特殊站点精准清洗
    if (url.hostname.includes('zhihu.com')) {
      // 知乎问题/回答保留核心路径
      url.search = '';
    } else if (url.hostname === 'x.com' || url.hostname === 'twitter.com') {
      // X / Twitter 推文仅保留干净路径
      url.search = '';
    } else {
      // 通用链接过滤黑名单参数
      trackingParams.forEach((param) => url.searchParams.delete(param));
    }

    return url.toString().replace(/\/$/, '');
  } catch {
    return rawUrl.split('?')[0] || rawUrl;
  }
}

/**
 * 将 Google / Gemini 缩略图或受限尺寸 URL 转换为超高清全尺寸 (s0 / 原分辨率) URL
 */
export function getHighResGoogleImageUrl(url: string): string {
  if (!url || !url.includes('googleusercontent.com')) return url;

  try {
    const urlObj = new URL(url);
    // 检查 pathname 中是否已经带有尺寸修饰符 (如 =s512, =w120-h120, =s96 等)
    if (/=[swh]\d+/i.test(urlObj.pathname)) {
      urlObj.pathname = urlObj.pathname.replace(/=[swh]\d+[^/]*/i, '=s0');
      return urlObj.toString();
    }

    // 若无尺寸修饰符，在 pathname 末尾追加 =s0 (全尺寸无损原图)
    if (!urlObj.pathname.endsWith('=s0')) {
      urlObj.pathname = `${urlObj.pathname}=s0`;
      return urlObj.toString();
    }
  } catch {
    if (url.includes('=')) {
      return url.replace(/=[swh]\d+[^?&]*/i, '=s0');
    }
  }

  return url;
}
