/**
 * Google Gemini 真实与边界 DOM Fixture
 */
export const GEMINI_CONVERSATION_HTML = `
<div class="chat-history">
  <!-- 1. 用户提问 -->
  <user-query class="user-query-container">
    <div class="query-text">
      <p>什么是 Web Extension Manifest V3 的主要改变？</p>
    </div>
  </user-query>

  <!-- 2. Gemini 模型回答 -->
  <model-response class="model-response">
    <div class="response-container">
      <message-content class="model-response-text">
        <p>Manifest V3 (MV3) 引入了以下几项重大革新：</p>
        <ol>
          <li><strong>Service Worker 替代 Background Page</strong>：从常驻后台变为按需事件驱动。</li>
          <li><strong>声明式网络请求</strong>：使用 <code>declarativeNetRequest</code> 替代阻塞式 <code>webRequest</code>。</li>
          <li><strong>禁止远程托管代码</strong>：所有可执行代码必须打包在扩展内部。</li>
        </ol>
        <pre><code class="language-json">{
  "manifest_version": 3,
  "name": "QuickShare"
}</code></pre>
      </message-content>
      <div class="buttons-container-v2">
        <button class="icon-button" aria-label="好评"></button>
      </div>
    </div>
  </model-response>
</div>
`;
