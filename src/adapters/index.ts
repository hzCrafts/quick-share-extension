import { BaseAdapter } from './base';
import { XAdapter } from './x.adapter';
import { ZhihuAdapter } from './zhihu.adapter';
import { UniversalAdapter } from './universal.adapter';

export * from './base';
export * from './x.adapter';
export * from './zhihu.adapter';
export * from './universal.adapter';

const adapters: BaseAdapter[] = [
  new XAdapter(),
  new ZhihuAdapter(),
  new UniversalAdapter(),
];

/**
 * 根据当前 URL 查找最匹配的适配器
 */
export function getAdapterForUrl(url: URL = new URL(window.location.href)): BaseAdapter {
  for (const adapter of adapters) {
    // 排除通用适配器（其 match 永远为 true），先匹配特异适配器
    if (adapter.platform !== 'universal' && adapter.match(url)) {
      return adapter;
    }
  }
  return adapters.find((a) => a.platform === 'universal')!;
}
