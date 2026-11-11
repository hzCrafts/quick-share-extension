// Reduced from the reported /landiantech/status/2119727913243414747 detail
// page. X renders the quote's unlinked <time> BEFORE the focal post's own
// timestamp link; the first <time> in the article is not the article's date.
export function quotedRootFixture(linkedQuoteTime = false) {
  const time = '<time datetime="2026-11-09T07:27:11.000Z">Nov 9</time>';
  return `<article data-testid="tweet" id="quoted-root">
    <div data-testid="User-Name"><a href="/landiantech">蓝点网</a><a href="/landiantech">@landiantech</a></div>
    <div data-testid="tweetText">只要你的脸皮够。。🤣🤣🤣🤣🤣</div>
    <div role="link" tabindex="0">
      <div data-testid="User-Name"><a href="/Weixin_WeChat">WeChat</a><a href="/Weixin_WeChat">@Weixin_WeChat</a>
        ${linkedQuoteTime ? `<a href="/Weixin_WeChat/status/2119693000000000000">${time}</a>` : time}
      </div>
      <div>Replying to <a href="/elonmusk">@elonmusk</a></div>
      <div data-testid="tweetText">Thanks 😉</div>
    </div>
    <a href="/landiantech/status/2119727913243414747" aria-label="5:44 PM · Nov 9, 2026">
      <time datetime="2026-11-09T09:44:51.000Z">5:44 PM · Nov 9, 2026</time>
    </a>
    <div role="group"></div>
  </article>`;
}

export const QUOTED_ROOT_COMMENT = `<article data-testid="tweet" id="quoted-root-comment">
  <div data-testid="User-Name"><a href="/china_TCL">Peter</a><a href="/china_TCL">@china_TCL</a></div>
  <div>Replying to <a href="/landiantech">@landiantech</a></div>
  <div data-testid="tweetText">中专生，看看这是什么：</div>
  <div data-testid="tweetPhoto"><img src="https://pbs.twimg.com/media/comment-table.jpg?name=large"></div>
  <a href="/china_TCL/status/2119765663921459555"><time datetime="2026-11-09T12:14:00.000Z">8:14 PM</time></a>
  <div role="group"></div>
</article>`;
