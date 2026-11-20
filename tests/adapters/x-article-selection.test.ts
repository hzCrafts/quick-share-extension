import { afterEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { XAdapter } from '@/adapters/x.adapter';
import { extractSelection } from '@/utils/selection';
import ShareCard from '@/components/card/ShareCard.vue';
import { ARTICLE_TITLE, articleTweet } from '../fixtures/x-article.fixture';

afterEach(() => { document.body.innerHTML = ''; });
function setup(cover?: string) {
  document.body.innerHTML = articleTweet(cover);
  const tweet = document.querySelector<HTMLElement>('article')!;
  const body = tweet.querySelector<HTMLElement>('[data-testid="twitterArticleRichTextView"]')!;
  const range = document.createRange(); range.selectNodeContents(body.querySelectorAll('[data-text]')[1]);
  return { tweet, body, range, adapter: new XAdapter() };
}
describe('X Article selections carry their own header', () => {
  it('extracts through the shared Range pipeline, without duplicating header/context/media', async () => {
    const { tweet, body, range, adapter } = setup();
    expect(adapter.getContentRootFromEntity(tweet)).toBe(body);
    const post = await extractSelection(adapter, range);
    expect(post?.article).toEqual({ title: ARTICLE_TITLE, coverUrl: 'https://pbs.twimg.com/media/HXbHkrabkAAefDL?format=jpg&name=large' });
    expect(post?.content).toBe(range.toString());
    expect(post?.excerptBeforeHtml).not.toContain(ARTICLE_TITLE);
    expect(post?.excerptBeforeHtml).toContain('前文');
    expect(post?.excerptAfterHtml).toContain('<strong');
    expect(post?.contentHtml).not.toContain('<img');
    expect(post?.media).toBeUndefined();
    expect(post?.contextThread).toBeUndefined();
    expect((await adapter.extract(tweet))?.article).toBeUndefined();
  });
  it('does not use a body image when the cover is missing', async () => {
    const { body, range, adapter } = setup('');
    body.insertAdjacentHTML('beforeend', '<img src="https://example.com/inline.png">');
    expect((await extractSelection(adapter, range))?.article).toEqual({ title: ARTICLE_TITLE });
  });
  it('rejects unsafe cover URLs', async () => {
    const { range, adapter } = setup('javascript:alert(1)');
    expect((await extractSelection(adapter, range))?.article?.coverUrl).toBeUndefined();
  });
  it('leaves ordinary tweets and quoted Article previews alone', async () => {
    document.body.innerHTML = `<article data-testid="tweet"><div data-testid="tweetText">Ordinary post</div><div data-testid="quoteTweet">${articleTweet()}</div></article>`;
    const body = document.querySelector('[data-testid="tweetText"]')!;
    const range = document.createRange(); range.selectNodeContents(body);
    const post = await extractSelection(new XAdapter(), range);
    expect(post?.article).toBeUndefined();
    expect(post?.content).toBe('Ordinary post');
  });
  it.each(['raycast-dark', 'liquid-glass', 'craft-editorial'])('renders cover/title before excerpt in %s, with graceful cover failure', async themeId => {
    const { range, adapter } = setup();
    const post = await extractSelection(adapter, range);
    const wrapper = mount(ShareCard, { props: { post: post!, options: {
      themeId, showOuterPadding: true, padding: 24, showQrCode: false, showWatermark: false,
      showStats: false, fontScale: 1, cardRadius: 24, authorAvatarRadius: 'rounded-full', aspectRatio: 'auto',
    } } });
    try {
      expect(wrapper.findAll('.qs-article-title')).toHaveLength(1);
      expect(wrapper.get('.qs-article-title').text()).toBe(ARTICLE_TITLE);
      expect(wrapper.html().indexOf('qs-article-cover')).toBeLessThan(wrapper.html().indexOf('qs-article-title'));
      expect(wrapper.html().indexOf('qs-article-title')).toBeLessThan(wrapper.html().indexOf('qs-excerpt-wrapper'));
      await wrapper.get('.qs-article-cover').trigger('error');
      expect(wrapper.find('.qs-article-cover').exists()).toBe(false);
      expect(wrapper.get('.qs-article-title').text()).toBe(ARTICLE_TITLE);
    } finally { wrapper.unmount(); }
  });
});
