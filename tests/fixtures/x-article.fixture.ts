// Structural selectors/order verified on the supplied whereisvivien Article.
export const ARTICLE_TITLE = 'AI 时代如何做产品｜Manus张涛北大分享逐字稿';
export function articleTweet(cover = 'https://pbs.twimg.com/media/HXbHkrabkAAefDL?format=jpg&name=medium') {
  return `<article data-testid="tweet">
    <div data-testid="User-Name"><a href="/whereisvivien">Viviennn ★</a></div>
    <article data-testid="twitterArticleReadView">
      ${cover ? `<a href="/whereisvivien/article/2123103532182282353/media/1"><div data-testid="tweetPhoto"><img src="${cover.replaceAll('&', '&amp;')}"></div></a>` : ''}
      <div data-testid="twitter-article-title">${ARTICLE_TITLE}</div>
      <div data-testid="twitterArticleRichTextView"><div contenteditable="false">
        <div class="public-DraftStyleDefault-block"><span data-text="true">前文段落。</span></div>
        <div class="public-DraftStyleDefault-block"><span data-text="true">Chatbot 这个产品形态本身，限制了 AI 模型的能力表达。</span></div>
        <div class="public-DraftStyleDefault-block"><strong data-text="true">后文仍然保留原有层次。</strong></div>
      </div></div>
    </article>
    <a href="/whereisvivien/status/2123103532182282353"><time datetime="2026-11-18T01:00:00Z">Nov 18</time></a>
  </article>`;
}
