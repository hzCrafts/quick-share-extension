import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ShareModal from '@/components/modal/ShareModal.vue';
import type { PostData } from '@/types/post';

describe('ShareModal 视图模式与 DOM 调试模式测试', () => {
  const samplePost: PostData = {
    id: 'https://www.zhihu.com/question/123/answer/456',
    platform: 'zhihu',
    url: 'https://www.zhihu.com/question/123/answer/456',
    title: '现代前端工程化演进思考',
    author: {
      name: 'Ryan Cui',
      handle: '@ryancui',
      avatarUrl: 'https://example.com/avatar.jpg',
    },
    content: '第一段：架构与抽象\n第二段：代码示例 vitest',
    contentHtml: '<p>第一段：架构与抽象</p><p>第二段：代码示例 <code>vitest</code></p>',
    createdAt: '2026-09-01T12:00:00.000Z',
  };

  it('默认渲染「预览图」模式与「真实 DOM」切换按钮', () => {
    const wrapper = mount(ShareModal, {
      props: {
        post: samplePost,
        visible: true,
      },
    });

    expect(wrapper.text()).toContain('预览图');
    expect(wrapper.text()).toContain('真实 DOM');
    expect(wrapper.text()).toContain('DEBUG');
  });

  it('点击「真实 DOM」按钮可无缝切换为活体 DOM 审查模式', async () => {
    const wrapper = mount(ShareModal, {
      props: {
        post: samplePost,
        visible: true,
      },
    });

    const domBtn = wrapper.findAll('button').find((b) => b.text().includes('真实 DOM'));
    expect(domBtn).toBeDefined();

    await domBtn!.trigger('click');

    // 验证切换为 DOM 模式后，悬浮工具栏出现「复制 HTML」和「控制台打印/已打印」辅助按钮
    expect(wrapper.text()).toContain('复制 HTML');
    expect(wrapper.text()).toMatch(/控制台打印|已打印/);
    expect(wrapper.text()).toContain('DOM 调试模式');

    // 验证视口内部挂载了真实的 ShareCard 组件 DOM 节点
    expect(wrapper.find('.quick-share-rich-body').exists()).toBe(true);
    expect(wrapper.html()).toContain('第一段：架构与抽象');
  });
});
