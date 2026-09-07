import { BaseAdapter } from './base';
import { XAdapter } from './x.adapter';
import { ZhihuAdapter } from './zhihu.adapter';
import { ChatGPTAdapter } from './chatgpt.adapter';
import { GeminiAdapter } from './gemini.adapter';

export * from './base';
export * from './x.adapter';
export * from './zhihu.adapter';
export * from './chatgpt.adapter';
export * from './gemini.adapter';

const adapters: BaseAdapter[] = [
  new XAdapter(),
  new ZhihuAdapter(),
  new ChatGPTAdapter(),
  new GeminiAdapter(),
];

/**
 * 根据当前 URL 查找匹配的站点适配器
 */
export function getAdapterForUrl(url: URL = new URL(window.location.href)): BaseAdapter | null {
  for (const adapter of adapters) {
    if (adapter.match(url)) {
      return adapter;
    }
  }
  return null;
}
