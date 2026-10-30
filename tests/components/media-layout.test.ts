import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { compileStyle, parse } from 'vue/compiler-sfc';
import ShareCard from '@/components/card/ShareCard.vue';
import cardSource from '@/components/card/ShareCard.vue?raw';
import { XAdapter } from '@/adapters/x.adapter';
import type { PostData, PostMedia } from '@/types/post';
import type { CardRenderOptions } from '@/types/theme';

// Check the cascade: DOM-only tests missed the video overrides that removed
// mosaic row spans and made images size themselves to their original height.
const css = compileStyle({
  source: parse(cardSource).descriptor.styles[0].content,
  id: (ShareCard as typeof ShareCard & { __scopeId: string }).__scopeId,
  scoped: true,
}).code;
const options: CardRenderOptions = {
  themeId: 'liquid-glass',
  showOuterPadding: true,
  padding: 24,
  showQrCode: false,
  showWatermark: false,
  showStats: false,
  fontScale: 1,
  cardRadius: 24,
  authorAvatarRadius: 'rounded-full',
  aspectRatio: 'auto',
};
const post: PostData = {
  id: 'post',
  platform: 'x',
  url: 'https://x.com/author/status/1',
  author: { name: 'Author' },
  content: 'Post text',
};
const patterns = [2, 3, 4].flatMap((count) =>
  Array.from({ length: 2 ** count }, (_, bits) =>
    Array.from({ length: count }, (_, index) => (bits & (1 << index) ? 'v' : 'i')).join(''),
  ),
);
// X currently uses up to four attachments; exercise the shared 3-column
// fallback too, without claiming all permutations of arbitrarily large lists.
const largerPatterns = [5, 6, 9].flatMap((count) => [
  ...new Set([
    'i'.repeat(count),
    'v'.repeat(count),
    Array.from({ length: count }, (_, i) => (i % 2 ? 'i' : 'v')).join(''),
    Array.from({ length: count }, (_, i) => (i % 2 ? 'v' : 'i')).join(''),
    ...Array.from({ length: count }, (_, videoIndex) =>
      Array.from({ length: count }, (_, i) => (i === videoIndex ? 'v' : 'i')).join(''),
    ),
  ]),
]);
const mediaFor = (pattern: string): PostMedia[] =>
  [...pattern].map((type, index) => ({
    type: type === 'v' ? 'video' : 'image',
    url: `https://pbs.twimg.com/media/fixture-${index}.jpg`,
    aspectRatio: index % 2 ? 16 / 9 : 9 / 16,
    ...(type === 'v' ? { duration: `0:0${index + 1}` } : {}),
  }));
let sheet: HTMLStyleElement;
beforeEach(() => {
  sheet = document.createElement('style');
  sheet.textContent = css;
  document.head.appendChild(sheet);
});
afterEach(() => {
  sheet.remove();
  document.body.innerHTML = '';
});

async function nativeQuote(media: PostMedia[]): Promise<PostData> {
  const entity = document.createElement('article');
  entity.dataset.testid = 'tweet';
  entity.innerHTML = `<div data-testid="User-Name"><a href="/author">Author</a></div>
    <div data-testid="tweetText">My comment</div>
    <div role="link" data-testid="quoteTweet">
      <div data-testid="User-Name"><a href="/quoted">Quoted author</a></div>
      <div data-testid="tweetText">Quoted text</div>
      ${media
        .map((item) =>
          item.type === 'video'
            ? `<div data-testid="videoComponent"><video poster="${item.posterUrl || item.url}"></video><span>${item.duration}</span></div>`
            : `<div data-testid="tweetPhoto"><img src="${item.url}"></div>`,
        )
        .join('')}
    </div>`;
  document.body.appendChild(entity);
  let index = 0;
  for (const item of media) {
    if (item.type !== 'video') continue;
    Object.defineProperties(entity.querySelectorAll('video')[index++], {
      videoWidth: { value: item.aspectRatio! * 900 },
      videoHeight: { value: 900 },
    });
  }
  const result = await new XAdapter().extract(entity, undefined, true);
  entity.remove();
  return result!;
}

async function casesFor(media: PostMedia[]) {
  return [
    { data: { ...post, media }, selector: '.qs-media-gallery' },
    { data: await nativeQuote(media), selector: '.qs-native-quote .quick-share-quote-media-grid' },
    {
      data: { ...post, id: 'reply', parentThreadPost: { ...post, media } },
      selector: '.qs-reply-quote .quick-share-quote-media-grid',
    },
  ];
}

describe.each(['raycast-dark', 'liquid-glass', 'craft-editorial'])('media CSS in %s', (themeId) => {
  // All permutations, including video-first/photo-first and 3 or 4 videos.
  it.each([...patterns, ...largerPatterns])(
    'keeps %s compact in posts, native quotes and reply quotes',
    async (pattern) => {
      const media = mediaFor(pattern);
      const cases = await casesFor(media);
      for (const { data, selector } of cases) {
        const wrapper = mount(ShareCard, {
          props: { post: data, options: { ...options, themeId } },
          attachTo: document.body,
        });
        try {
          const grid = wrapper.get(selector);
          const children = Array.from(grid.element.children);
          const videos = media.filter((item) => item.type === 'video');
          expect(grid.findAll('img').map((img) => img.attributes('src'))).toEqual(
            media.map((item) => item.url),
          );
          expect(grid.findAll('.qs-video-play-badge')).toHaveLength(videos.length);
          expect(grid.findAll('.qs-video-duration-badge').map((badge) => badge.text())).toEqual(
            videos.map((item) => item.duration),
          );
          const intrinsicPair = pattern === 'vv';
          const style = getComputedStyle(grid.element);
          if (pattern.length === 3 || pattern.length === 4) {
            expect(style.aspectRatio).toBe('4 / 3');
            expect(style.gridTemplateRows).toBe('repeat(2, minmax(0, 1fr))');
            expect(getComputedStyle(children[0]).gridRow).toBe(pattern.length === 3 ? 'span 2' : '');
          } else if (pattern.length > 4) {
            expect(style.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))');
            for (const child of children) {
              expect(getComputedStyle(child).aspectRatio).toMatch(/^1(?:\s*\/\s*1)?$/);
              expect(getComputedStyle(child).gridRow).toBe('');
            }
          }
          for (const image of grid.findAll('img')) {
            expect(getComputedStyle(image.element).height).toBe(intrinsicPair ? 'auto' : '100%');
            expect(getComputedStyle(image.element).objectFit).toBe(intrinsicPair ? 'contain' : 'cover');
            expect(getComputedStyle(image.element).maxHeight).toBe('none');
          }
        } finally {
          wrapper.unmount();
        }
      }
    },
  );

  it.each([undefined, 0, -1, NaN, Infinity])(
    'uses a compact fallback for missing/invalid video ratio %s',
    async (ratio) => {
      const media = mediaFor('vv');
      media[1].aspectRatio = ratio;
      for (const { data, selector } of await casesFor(media)) {
        const wrapper = mount(ShareCard, {
          props: { post: data, options: { ...options, themeId } },
          attachTo: document.body,
        });
        try {
          const grid = wrapper.get(selector);
          expect(grid.classes()).not.toContain('qs-media-video-pair');
          for (const image of grid.findAll('img')) {
            expect(getComputedStyle(image.element).height).toBe('100%');
            expect(getComputedStyle(image.element).objectFit).toBe('cover');
          }
        } finally {
          wrapper.unmount();
        }
      }
    },
  );

  it.each([
    [16 / 9, 16 / 9],
    [9 / 16, 9 / 16],
    [16 / 9, 9 / 16],
    [9 / 16, 16 / 9],
    [1, 1],
    [21 / 9, 9 / 21],
  ])('keeps proportional video columns at ratios %s and %s', async (first, second) => {
    const media = mediaFor('vv');
    media[0].aspectRatio = first;
    media[1].aspectRatio = second;
    for (const { data, selector } of await casesFor(media)) {
      const wrapper = mount(ShareCard, {
        props: { post: data, options: { ...options, themeId } },
        attachTo: document.body,
      });
      try {
        const grid = wrapper.get(selector);
        const columns = [...getComputedStyle(grid.element).gridTemplateColumns.matchAll(/([\d.]+)fr/g)].map(
          (match) => Number(match[1]),
        );
        expect(columns).toHaveLength(2);
        expect(columns[0]).toBeCloseTo(first, 12);
        expect(columns[1]).toBeCloseTo(second, 12);
        for (const image of grid.findAll('img'))
          expect(getComputedStyle(image.element).objectFit).toBe('contain');
      } finally {
        wrapper.unmount();
      }
    }
  });

  it('recomputes the layout when video metadata becomes available or is replaced', async () => {
    const media = mediaFor('vv');
    delete media[1].aspectRatio;
    const wrapper = mount(ShareCard, {
      props: { post: { ...post, media }, options: { ...options, themeId } },
      attachTo: document.body,
    });
    try {
      expect(getComputedStyle(wrapper.get('.qs-media-img').element).objectFit).toBe('cover');
      await wrapper.setProps({ post: { ...post, media: mediaFor('vv') } });
      expect(wrapper.get('.qs-media-gallery').classes()).toContain('qs-media-video-pair');
      expect(wrapper.get('.qs-media-gallery').attributes('style')).toContain('0.5625fr');
      await wrapper.setProps({ post: { ...post, media: mediaFor('vvi') } });
      expect(wrapper.get('.qs-media-gallery').classes()).toContain('qs-media-three');
      expect(wrapper.get('.qs-media-gallery').classes()).not.toContain('qs-media-video-pair');
      expect(wrapper.get('.qs-media-gallery').attributes('style')).toContain('repeat(2, minmax(0, 1fr))');
    } finally {
      wrapper.unmount();
    }
  });

  it.each(['native', 'reply'])('keeps own media separate from %s quote media', async (context) => {
    for (const [ownPattern, quotePattern] of [
      ['vv', 'vvi'],
      ['vvi', 'vv'],
    ]) {
      const own = mediaFor(ownPattern),
        quoted = mediaFor(quotePattern);
      const data =
        context === 'native'
          ? { ...(await nativeQuote(quoted)), media: own }
          : { ...post, id: 'reply', media: own, parentThreadPost: { ...post, media: quoted } };
      const wrapper = mount(ShareCard, {
        props: { post: data, options: { ...options, themeId } },
        attachTo: document.body,
      });
      try {
        const galleries = [wrapper.get('.qs-media-gallery'), wrapper.get('.quick-share-quote-media-grid')];
        for (const [i, pattern] of [ownPattern, quotePattern].entries()) {
          expect(galleries[i].findAll('img')).toHaveLength(pattern.length);
          for (const image of galleries[i].findAll('img'))
            expect(getComputedStyle(image.element).objectFit).toBe(pattern === 'vv' ? 'contain' : 'cover');
        }
        const root = wrapper.element;
        expect(
          Array.from(root.querySelectorAll('.qs-media-gallery, .qs-native-quote, .qs-reply-quote'))[0],
        ).toBe(galleries[0].element);
      } finally {
        wrapper.unmount();
      }
    }
  });

  it('uses each video poster rather than treating its video URL as a photo', async () => {
    const media = mediaFor('vvi');
    media[0].posterUrl = 'https://pbs.twimg.com/media/poster-0.jpg';
    media[1].posterUrl = 'https://pbs.twimg.com/media/poster-1.jpg';
    for (const { data, selector } of await casesFor(media)) {
      const wrapper = mount(ShareCard, {
        props: { post: data, options: { ...options, themeId } },
        attachTo: document.body,
      });
      try {
        expect(
          wrapper
            .get(selector)
            .findAll('img')
            .map((img) => img.attributes('src')),
        ).toEqual(media.map((item) => item.posterUrl || item.url));
        expect(wrapper.get(selector).findAll('.qs-video-play-badge')).toHaveLength(2);
      } finally {
        wrapper.unmount();
      }
    }
  });

  it('keeps a single portrait video at its original ratio in native quotes', async () => {
    const wrapper = mount(ShareCard, {
      props: { post: await nativeQuote(mediaFor('v')), options: { ...options, themeId } },
      attachTo: document.body,
    });
    try {
      const image = wrapper.get('.qs-native-quote .quick-share-quote-img');
      expect(getComputedStyle(image.element).height).toBe('auto');
      expect(getComputedStyle(image.element).maxHeight).toBe('none');
      expect(getComputedStyle(image.element).objectFit).toBe('contain');
    } finally {
      wrapper.unmount();
    }
  });
});
