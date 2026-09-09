/**
 * X (Twitter) 真实与边界 DOM Fixture
 */
export const X_TWEET_SIMPLE_HTML = `
<article data-testid="tweet" tabindex="0">
  <div class="css-175oi2r">
    <div data-testid="User-Name">
      <div class="user-info">
        <a href="/elonmusk" role="link">
          <span>Elon Musk</span>
        </a>
        <div class="user-handle">
          <span>@elonmusk</span>
        </div>
      </div>
    </div>
    <div data-testid="Tweet-User-Avatar">
      <img src="https://pbs.twimg.com/profile_images/avatar_normal.jpg" alt="Elon Musk" />
    </div>
    <div data-testid="tweetText" lang="en">
      <span>Slow is Fast. Building multi-planetary life is a long-term goal.</span>
    </div>
    <div class="time-container">
      <a href="/elonmusk/status/1234567890?utm_source=twitter&ref=share">
        <time datetime="2026-09-01T12:00:00.000Z">Sep 1, 2026</time>
      </a>
    </div>
    <div role="group" aria-label="Tweet actions"></div>
  </div>
</article>
`;

export const X_TWEET_MULTILINE_IMAGES_HTML = `
<article data-testid="tweet" tabindex="0">
  <div data-testid="User-Name">
    <a href="/antigravity"><span>Antigravity AI</span></a>
    <div><span>@antigravity</span></div>
  </div>
  <div data-testid="Tweet-User-Avatar">
    <img src="https://pbs.twimg.com/profile_images/ai_normal.jpg" alt="Antigravity AI" />
  </div>
  <div data-testid="tweetText">
    <span>First paragraph of announcement.</span>
    <br />
    <br />
    <span>Second paragraph with code reference <code>npm install</code> and link <a href="https://t.co/xyz">wxt.dev</a></span>
  </div>
  <div data-testid="tweetPhoto">
    <img src="https://pbs.twimg.com/media/preview1?format=jpg&name=360x360" alt="Image 1" />
  </div>
  <div data-testid="tweetPhoto">
    <img src="https://pbs.twimg.com/media/preview2?format=png&name=small" alt="Image 2" />
  </div>
  <a href="/antigravity/status/9876543210">
    <time datetime="2026-09-02T15:30:00.000Z">Sep 2, 2026</time>
  </a>
  <div role="group"></div>
</article>
`;
