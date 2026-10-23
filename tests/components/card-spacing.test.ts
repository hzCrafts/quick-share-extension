import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { compileStyle, parse } from 'vue/compiler-sfc';
import ShareCard from '@/components/card/ShareCard.vue';
import cardSource from '@/components/card/ShareCard.vue?raw';
import { XAdapter } from '@/adapters/x.adapter';
import { extractSelection } from '@/utils/selection';
import type { CardRenderOptions } from '@/types/theme';

// Vitest normally stubs SFC styles. Load the component's compiled stylesheet
// here so the assertions cover the CSS cascade, not just the presence of tags.
const css = compileStyle({
  source: parse(cardSource).descriptor.styles[0].content,
  id: (ShareCard as typeof ShareCard & { __scopeId: string }).__scopeId,
  scoped: true,
}).code;
const themes = ['raycast-dark', 'liquid-glass', 'craft-editorial'] as const;
const options: CardRenderOptions = {
  themeId: 'raycast-dark', showOuterPadding: true, padding: 24,
  showQrCode: false, showWatermark: false, showStats: false,
  fontScale: 1, cardRadius: 16, authorAvatarRadius: 'rounded-full', aspectRatio: 'auto',
};
let sheet: HTMLStyleElement;
let card: VueWrapper | undefined;
beforeEach(() => {
  sheet = document.createElement('style'); sheet.textContent = css; document.head.appendChild(sheet);
});
afterEach(() => { card?.unmount(); card = undefined; sheet.remove(); document.body.innerHTML = ''; });

function tweet(body: string, media = '') {
  document.body.innerHTML = `<article data-testid="tweet">
    <div data-testid="User-Name"><a href="/author">Author</a></div>
    <div data-testid="tweetText">${body}</div>${media}
    <div role="link" data-testid="quoteTweet"><div data-testid="User-Name"><a href="/quoted">Quoted author</a></div><div data-testid="tweetText"><span>Quoted text</span></div></div>
  </article>`;
  return document.querySelector<HTMLElement>('article')!;
}

// A native quote and a reply's root-post quote should both have one 18px gap.
// With own media, the 24px text-to-media gap must remain intact.
describe.each(themes)('X paragraph and quote spacing in %s', themeId => {
  it.each(['<span>One line ❤️!</span>', '<span>First\n\nSecond</span>'])(
    'does not stack a content bottom margin with the quote top margin: %s', async body => {
      const post = await new XAdapter().extract(tweet(body), undefined, true);
      card = mount(ShareCard, { props: { post: post!, options: { ...options, themeId } }, attachTo: document.body });
      expect(getComputedStyle(card.get('.qs-card-content').element).marginBottom).toBe('0px');
      expect(getComputedStyle(card.get('.qs-native-quote .quick-share-quote-tweet').element).marginTop).toBe('18px');
      expect(card.findAll('.qs-card-content br')).toHaveLength(body.includes('\n') ? 2 : 0);
    }
  );

  it('preserves ordinary tweet line breaks without inserting paragraph spacing', async () => {
    const entity = tweet('<span>First line</span><br><br><span>Second line</span>');
    entity.querySelector('[data-testid="quoteTweet"]')!.remove();
    const post = await new XAdapter().extract(entity, undefined, true);
    card = mount(ShareCard, { props: { post: post!, options: { ...options, themeId } }, attachTo: document.body });
    expect(card.find('.qs-native-quote').exists()).toBe(false);
    expect(card.findAll('.qs-card-content br')).toHaveLength(2);
    expect(card.findAll('.quick-share-article-paragraph')).toHaveLength(0);
    expect(getComputedStyle(card.get('.qs-card-content').element).marginBottom).toBe('24px');
  });

  it('keeps reply-to-root separation consistent with native quotes', async () => {
    const entity = tweet('<span>My reply</span>');
    entity.querySelector('[data-testid="quoteTweet"]')!.remove();
    const post = await new XAdapter().extract(entity, undefined, true);
    post!.contextThread = { rootPost: {
      id: 'root', platform: 'x', url: 'https://x.com/root/status/1',
      author: { name: 'Root author' }, content: 'Root text',
    } };
    card = mount(ShareCard, { props: { post: post!, options: { ...options, themeId } }, attachTo: document.body });
    expect(getComputedStyle(card.get('.qs-card-content').element).marginBottom).toBe('0px');
    expect(getComputedStyle(card.get('.qs-reply-quote').element).marginTop).toBe('18px');
  });

  it('keeps text-to-photo spacing and only one photo-to-quote gap', async () => {
    const post = await new XAdapter().extract(tweet('<span>Attached photo</span>', '<div data-testid="tweetPhoto"><img src="https://pbs.twimg.com/media/photo?name=large"></div>'), undefined, true);
    card = mount(ShareCard, { props: { post: post!, options: { ...options, themeId } }, attachTo: document.body });
    expect(getComputedStyle(card.get('.qs-card-content').element).marginBottom).toBe('24px');
    expect(getComputedStyle(card.get('.qs-media-gallery').element).marginBottom).toBe('0px');
    expect(getComputedStyle(card.get('.qs-native-quote .quick-share-quote-tweet').element).marginTop).toBe('18px');
  });

  it('keeps article wrapper spacing without adding paragraph margins or br', async () => {
    const entity = tweet('<div style="padding-bottom:20px"><div class="public-DraftStyleDefault-block" style="margin:0"><span>First</span></div></div><div style="padding-bottom:20px"><div class="public-DraftStyleDefault-block" style="margin:0"><strong>Second</strong></div></div>');
    const range = document.createRange();
    range.setStart(entity.querySelector('[data-testid="tweetText"] span')!.firstChild!, 0);
    range.setEnd(entity.querySelector('strong')!.firstChild!, 6);
    const post = await extractSelection(new XAdapter(), range);
    card = mount(ShareCard, { props: { post: post!, options: { ...options, themeId } }, attachTo: document.body });
    const blocks = card.findAll('.qs-excerpt-wrapper .quick-share-rich-body > div');
    expect(blocks).toHaveLength(2);
    for (const block of blocks) expect(getComputedStyle(block.element).paddingBottom).toBe('20px');
    for (const line of card.findAll('.quick-share-article-paragraph')) expect(getComputedStyle(line.element).marginBottom).toBe('0px');
    expect(card.findAll('.qs-excerpt-wrapper br')).toHaveLength(0);
  });
});
