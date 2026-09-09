/**
 * ChatGPT 真实与边界 DOM Fixture
 */
export const CHATGPT_CONVERSATION_HTML = `
<div class="conversation-container">
  <!-- 1. 用户提问 Turn -->
  <article data-testid="conversation-turn-1" data-message-author-role="user">
    <div class="user-message-container">
      <div class="whitespace-pre-wrap">请解释 Rust 所有权与生命周期机制</div>
    </div>
  </article>

  <!-- 2. Assistant 回复 Turn -->
  <article data-testid="conversation-turn-2" data-message-author-role="assistant">
    <div class="markdown prose">
      <p>Rust 的所有权系统是其最独特且核心的内存管理机制：</p>
      
      <h3>1. 所有权三大核心规则</h3>
      <ul>
        <li>每个值在 Rust 中都有一个<strong>所有者</strong>（Owner）。</li>
        <li>同一时刻只能有一个所有者。</li>
        <li>当所有者离开作用域时，该值会被立即丢弃（Drop）。</li>
      </ul>

      <p>以下是一个标准的代码示例：</p>
      <div class="code-container">
        <div class="code-header">
          <span>rust</span>
          <button>复制代码</button>
        </div>
        <pre><code class="language-rust">fn main() {
    let s1 = String::from("hello");
    let s2 = s1; // s1 所有权移动到 s2
    println!("{}", s2);
}</code></pre>
      </div>

      <p>生命周期与借用检查对比：</p>
      <table>
        <thead>
          <tr>
            <th>特性</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>不可变借用</td>
            <td><code>&amp;T</code>，允许多个并发只读</td>
          </tr>
          <tr>
            <td>可变借用</td>
            <td><code>&amp;mut T</code>，独占写访问</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 操作栏容器 -->
    <div class="flex items-center" aria-label="回复操作">
      <button data-testid="copy-turn-action-button" aria-label="复制回复"></button>
    </div>
  </article>
</div>
`;
