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
