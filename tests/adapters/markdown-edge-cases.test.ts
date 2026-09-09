import { describe, it, expect } from 'vitest';
import { sanitizeHtmlForCard } from '@/utils/exporter';

describe('类 Markdown 与 DOM 结构保真度 Edge Cases 测试', () => {
  describe('1. 段落与换行保真度', () => {
    it('保留多个独立 <p> 段落结构，不发生合并坍缩', () => {
      const input = '<p>第一段内容</p><p>第二段内容</p><p>第三段内容</p>';
      const sanitized = sanitizeHtmlForCard(input);
      
      const container = document.createElement('div');
      container.innerHTML = sanitized;
      
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs.length).toBe(3);
      expect(paragraphs[0].textContent).toBe('第一段内容');
      expect(paragraphs[1].textContent).toBe('第二段内容');
      expect(paragraphs[2].textContent).toBe('第三段内容');
    });

    it('保留段落内的 <br> 显式换行', () => {
      const input = '<p>首行内容<br>第二行换行内容<br><br>第三行空行后内容</p>';
      const sanitized = sanitizeHtmlForCard(input);
      
      const container = document.createElement('div');
      container.innerHTML = sanitized;
      
      const brTags = container.querySelectorAll('br');
      expect(brTags.length).toBe(3);
      expect(container.textContent).toContain('首行内容');
      expect(container.textContent).toContain('第二行换行内容');
      expect(container.textContent).toContain('第三行空行后内容');
    });
  });

  describe('2. 代码块与缩进保真度', () => {
    it('完整保留 <pre><code> 内部的多行换行、空格与制表符缩进', () => {
      const codeSnippet = `fn fibonacci(n: u32) -> u32 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}`;
      const input = `<pre><code class="language-rust">${codeSnippet}</code></pre>`;
      const sanitized = sanitizeHtmlForCard(input);
      
      const container = document.createElement('div');
      container.innerHTML = sanitized;
      
      const pre = container.querySelector('pre');
      const code = container.querySelector('code');
      
      expect(pre).not.toBeNull();
      expect(code).not.toBeNull();
      expect(code?.className).toContain('language-rust');
      expect(code?.textContent).toBe(codeSnippet);
    });

    it('正确转义代码块内的 < 和 > 字符，不破坏外层 DOM', () => {
      const input = '<pre><code>const map = new Map&lt;string, Array&lt;number&gt;&gt;();</code></pre>';
      const sanitized = sanitizeHtmlForCard(input);
      
      const container = document.createElement('div');
      container.innerHTML = sanitized;
      
      const code = container.querySelector('code');
      expect(code?.textContent).toBe('const map = new Map<string, Array<number>>();');
    });
  });

  describe('3. 嵌套列表与引用块保真度', () => {
    it('保留多层嵌套无序列表 <ul><li><ul> 的层级深度与节点关系', () => {
      const input = `
        <ul>
          <li>顶级项目 1</li>
          <li>顶级项目 2
            <ul>
              <li>二级子项目 2.1</li>
              <li>二级子项目 2.2</li>
            </ul>
          </li>
        </ul>
      `;
      const sanitized = sanitizeHtmlForCard(input);
      
      const container = document.createElement('div');
      container.innerHTML = sanitized;
      
      const topUl = container.querySelector('ul');
      expect(topUl).not.toBeNull();
      const topLis = topUl?.children;
      expect(topLis?.length).toBe(2);
      
      const subUl = topLis?.[1].querySelector('ul');
      expect(subUl).not.toBeNull();
      expect(subUl?.querySelectorAll('li').length).toBe(2);
    });

    it('保留 <blockquote> 引用块及其内部的多段落结构', () => {
      const input = `
        <blockquote>
          <p>“Slow is fast.”</p>
          <p>—— 编程哲学</p>
        </blockquote>
      `;
      const sanitized = sanitizeHtmlForCard(input);
      
      const container = document.createElement('div');
      container.innerHTML = sanitized;
      
      const quote = container.querySelector('blockquote');
      expect(quote).not.toBeNull();
      const pTags = quote?.querySelectorAll('p');
      expect(pTags?.length).toBe(2);
      expect(pTags?.[0].textContent).toContain('Slow is fast');
    });
  });

  describe('4. 表格结构保真度', () => {
    it('完整保留 <table><thead><tbody><tr><th><td> 表格拓扑结构', () => {
      const input = `
        <table>
          <thead>
            <tr><th>Header 1</th><th>Header 2</th></tr>
          </thead>
          <tbody>
            <tr><td>Cell 1</td><td>Cell 2</td></tr>
            <tr><td>Cell 3</td><td>Cell 4</td></tr>
          </tbody>
        </table>
      `;
      const sanitized = sanitizeHtmlForCard(input);
      
      const container = document.createElement('div');
      container.innerHTML = sanitized;
      
      expect(container.querySelector('table')).not.toBeNull();
      expect(container.querySelector('thead')).not.toBeNull();
      expect(container.querySelector('tbody')).not.toBeNull();
      expect(container.querySelectorAll('th').length).toBe(2);
      expect(container.querySelectorAll('tbody tr').length).toBe(2);
      expect(container.querySelectorAll('td').length).toBe(4);
    });
  });

  describe('5. 图文混排 DOM 顺序保真度', () => {
    it('严格维持 [段落1 -> 图片 -> 段落2 -> 代码块] 的先后排列顺序', () => {
      const input = `
        <p>引入段落</p>
        <figure><img src="https://example.com/arch.png" alt="架构" /></figure>
        <p>核心解释</p>
        <pre><code>export default {};</code></pre>
        <p>结论段落</p>
      `;
      const sanitized = sanitizeHtmlForCard(input);
      
      const container = document.createElement('div');
      container.innerHTML = sanitized;
      
      const children = Array.from(container.children);
      const tagNames = children.map(el => el.tagName.toLowerCase());
      
      expect(tagNames).toEqual(['p', 'figure', 'p', 'pre', 'p']);
      expect(children[0].textContent).toBe('引入段落');
      expect(children[1].querySelector('img')?.getAttribute('src')).toBe('https://example.com/arch.png');
      expect(children[2].textContent).toBe('核心解释');
      expect(children[3].textContent).toContain('export default');
      expect(children[4].textContent).toBe('结论段落');
    });
  });

  describe('6. 安全清洗与非法属性过滤', () => {
    it('剔除潜在 XSS 攻击脚本与内联事件监听器，同时保留必要布局属性', () => {
      const input = `
        <p onclick="alert('hack')">安全文字</p>
        <img src="https://example.com/pic.jpg" onerror="alert(1)" width="400" />
        <script>window.evil = true;</script>
      `;
      const sanitized = sanitizeHtmlForCard(input);
      
      const container = document.createElement('div');
      container.innerHTML = sanitized;
      
      expect(container.querySelector('script')).toBeNull();
      expect(container.querySelector('p')?.getAttribute('onclick')).toBeNull();
      expect(container.querySelector('img')?.getAttribute('onerror')).toBeNull();
      expect(container.querySelector('img')?.getAttribute('src')).toBe('https://example.com/pic.jpg');
    });
  });
});
