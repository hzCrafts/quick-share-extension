/**
 * 知乎真实与边界 DOM Fixture
 */
export const ZHIHU_ANSWER_HTML = `
<div class="QuestionPage">
  <h1 class="QuestionHeader-title">如何评价现代前端架构设计？</h1>
  <div class="AnswerItem" data-zop='{"authorName":"资深工程师","itemId":99887766}'>
    <div class="AuthorInfo">
      <img class="AuthorInfo-avatar" src="https://picx.zhimg.com/v2-avatar_l.jpg" alt="资深工程师" />
      <div class="AuthorInfo-head">
        <span class="UserLink">
          <a class="UserLink-link" href="/people/senior-dev">资深工程师</a>
        </span>
        <span class="AuthorInfo-badgeText">全栈技术专家</span>
      </div>
    </div>
    <div class="RichContent">
      <div class="RichContent-inner">
        <span class="RichText ztext">
          <p>第一段：架构设计的核心在于抽象与长期可维护性。</p>
          <p>第二段：这是一个包含数学公式的段落：<span class="ztext-math" data-eeimg="1" data-tex="E=mc^2">E=mc^2</span>，以及行内代码 <code>Vue 3 Composition API</code>。</p>
          <p>第三段：这是一个包含知乎知达实体词链接的句子：<a href="https://zhida.zhihu.com/search?q=TypeScript" class="css-12345">
            <span class="zhida-icon-wrapper"><svg></svg></span>
            TypeScript
          </a> 提供了极高的类型安全性。</p>
          <figure>
            <img src="https://picx.zhimg.com/thumb.jpg" data-original="https://picx.zhimg.com/v2-highres.png" alt="架构图" />
          </figure>
          <p>第四段总结：Slow is Fast。</p>
        </span>
      </div>
      <div class="ContentItem-time">
        <a href="/question/123456/answer/99887766?utm_campaign=share&utm_source=wechat">
          <span>编辑于 2026-09-03</span>
        </a>
      </div>
      <div class="ContentItem-actions"></div>
    </div>
  </div>
</div>
`;

export const ZHIHU_ARTICLE_HTML = `
<div class="Post-NormalMain">
  <div class="Post-Header">
    <h1 class="Post-Title">深入理解 Vite 与 WXT 扩展开发</h1>
    <div class="AuthorInfo">
      <img class="AuthorInfo-avatar" src="https://picx.zhimg.com/avatar_art.jpg" alt="专栏作者" />
      <span class="UserLink-link">专栏作者</span>
    </div>
  </div>
  <div class="Post-content">
    <div class="RichText">
      <p>第一节：现代 Web Extension 构建管线。</p>
      <blockquote>
        <p>引用块：Vite 6 带来了极速的冷启动与 HMR 支持。</p>
      </blockquote>
      <p>第二节：Shadow DOM 隔离机制。</p>
    </div>
  </div>
</div>
`;
