import { createApp, nextTick, h, shallowRef } from 'vue';
import ShareCard from '@/components/card/ShareCard.vue';
import { XAdapter } from '@/adapters/x.adapter';
import { renderCardToCanvas } from '@/utils/exporter';
import '@/assets/style.css';

const themes = ['raycast-dark', 'liquid-glass', 'craft-editorial'];
const base = {
  id: 'main',
  platform: 'x',
  url: 'https://x.com/quickshare/status/1',
  author: { name: 'QuickShare', handle: '@quickshare' },
  content: '混合媒体布局验证',
  createdAt: '2026-10-30T02:00:00Z',
};
const options = {
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
const report = { layouts: 0, exports: 0, failures: [] as string[] };
const patterns = [2, 3, 4].flatMap((n) =>
  Array.from({ length: 2 ** n }, (_, bits) =>
    Array.from({ length: n }, (_, i) => (bits & (1 << i) ? 'v' : 'i')).join(''),
  ),
);
function assert(ok: boolean, msg: string) {
  if (!ok) throw Error(msg);
}
const near = (a: number, b: number) => Math.abs(a - b) < 1;
function fixture(ratio: number, index: number) {
  const w = Math.round(ratio * 300),
    h = 300;
  return (
    'data:image/svg+xml;base64,' +
    btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="${['#91c9d2', '#d6a68d', '#aca4ce', '#8db9a1'][index % 4]}"/><circle cx="${w / 2}" cy="150" r="75" fill="none" stroke="white" stroke-width="8"/><text x="50%" y="52%" font-size="35" text-anchor="middle" fill="#24313d">${index + 1}</text></svg>`,
    )
  );
}
function mediaFor(pattern: string, reverse = false) {
  return [...pattern].map((type, i) => {
    const aspectRatio = (i % 2 === 0) !== reverse ? 9 / 16 : 16 / 9;
    return {
      type: type === 'v' ? 'video' : 'image',
      url: fixture(aspectRatio, i),
      aspectRatio,
      ...(type === 'v' ? { duration: '0:12' } : {}),
    };
  });
}
async function contextPost(media: any[], context: string) {
  if (context === 'main') return { ...base, media };
  if (context === 'reply') return { ...base, id: 'reply', parentThreadPost: { ...base, media } };
  const entity = document.createElement('article');
  entity.dataset.testid = 'tweet';
  entity.innerHTML = `<div data-testid="User-Name"><a href="/quickshare">QuickShare</a></div><div data-testid="tweetText">引用内容</div><div data-testid="quoteTweet"><div data-testid="User-Name"><a href="/root">Root</a></div><div data-testid="tweetText">原帖附图</div>${media.map((m) => (m.type === 'video' ? `<div data-testid="videoComponent"><video poster="${m.url}"></video><span>${m.duration}</span></div>` : `<div data-testid="tweetPhoto"><img src="${m.url}"></div>`)).join('')}</div>`;
  document.body.appendChild(entity);
  let vi = 0;
  for (const m of media)
    if (m.type === 'video') {
      const video = entity.querySelectorAll('video')[vi++];
      Object.defineProperties(video, {
        videoWidth: { value: m.aspectRatio * 900 },
        videoHeight: { value: 900 },
      });
      video.getBoundingClientRect = () => ({ width: 0, height: 0 }) as DOMRect;
    }
  const post = await new XAdapter().extract(entity, undefined, true);
  entity.remove();
  return post!;
}
async function render(post: any, theme: string, component = ShareCard, width = 640) {
  const host = document.createElement('div');
  host.style.width = width + 'px';
  document.querySelector('#stage')!.appendChild(host);
  const state = shallowRef(post);
  const app = createApp({
    render: () => h(component, { post: state.value, options: { ...options, themeId: theme } }),
  });
  app.mount(host);
  await nextTick();
  await document.fonts.ready;
  await Promise.all([...host.querySelectorAll('img')].map((i) => i.decode()));
  return {
    host,
    async update(post: any) {
      state.value = post;
      await nextTick();
      await Promise.all([...host.querySelectorAll('img')].map((i) => i.decode()));
    },
    close() {
      app.unmount();
      host.remove();
    },
  };
}
const selector = (context: string) =>
  context === 'main'
    ? '.qs-media-gallery'
    : context === 'reply'
      ? '.qs-reply-quote .quick-share-quote-media-grid'
      : '.qs-native-quote .quick-share-quote-media-grid';
function verify(host: HTMLElement, media: any[], context: string, label: string) {
  const grid = host.querySelector(selector(context)) as HTMLElement,
    items = [...grid.children] as HTMLElement[],
    images = [...grid.querySelectorAll('img')];
  assert(items.length === media.length, label + ': missing media');
  assert(
    images.map((i) => i.getAttribute('src')).join('|') === media.map((m) => m.url).join('|'),
    label + ': reordered media',
  );
  const g = grid.getBoundingClientRect(),
    rects = items.map((i) => i.getBoundingClientRect()),
    gap = parseFloat(getComputedStyle(grid).gap),
    pair =
      media.length === 2 &&
      media.every((m) => m.type === 'video' && Number.isFinite(m.aspectRatio) && m.aspectRatio > 0);
  for (let i = 0; i < items.length; i++) {
    const r = rects[i],
      im = images[i].getBoundingClientRect();
    assert(r.width > 0 && r.height > 0, label + ': collapsed tile');
    assert(near(im.width, r.width) && near(im.height, r.height), label + ': image does not fill its tile');
    assert(
      r.left >= g.left - 1 && r.right <= g.right + 1 && r.top >= g.top - 1 && r.bottom <= g.bottom + 1,
      label + ': overflow',
    );
    for (let j = 0; j < i; j++) {
      const s = rects[j];
      assert(
        r.right <= s.left + 0.1 ||
          r.left >= s.right - 0.1 ||
          r.bottom <= s.top + 0.1 ||
          r.top >= s.bottom - 0.1,
        label + ': overlapping tiles',
      );
    }
    if (media[i].type === 'video') {
      const badge = items[i].querySelector('.qs-video-play-badge')!.getBoundingClientRect();
      assert(
        near((badge.left + badge.right) / 2, (r.left + r.right) / 2) &&
          near((badge.top + badge.bottom) / 2, (r.top + r.bottom) / 2),
        label + ': badge outside tile',
      );
    }
  }
  if (media.length === 3) {
    assert(near(g.width / g.height, 4 / 3), label + ': wrong mosaic ratio');
    assert(near(rects[0].height, g.height), label + ': first tile no longer spans both rows');
    assert(
      near(rects[1].right, rects[2].right) && near(rects[1].bottom + gap, rects[2].top),
      label + ': right column gap',
    );
  } else if (pair) {
    assert(near(rects[0].height, rects[1].height), label + ': unequal video heights');
    assert(
      Math.abs(rects[0].width / rects[1].width - media[0].aspectRatio / media[1].aspectRatio) < 0.02,
      label + ': wrong video proportions',
    );
  } else if (media.length === 4) {
    for (const r of rects)
      assert(
        near(r.width, (g.width - gap) / 2) && near(r.height, (g.height - gap) / 2),
        label + ': inconsistent 2x2',
      );
  } else if (media.length === 2) {
    assert(near(rects[0].height, rects[1].height), label + ': unequal mixed-pair height');
  } else if (media.length === 1 && media[0].type === 'video') {
    assert(Math.abs(g.width / g.height - media[0].aspectRatio) < 0.02, label + ': lost single-media ratio');
  }
  if (media.length > 4) {
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      assert(near(r.width, r.height), label + ': non-square multi-row tile');
      assert(
        near(r.left, g.left + (i % 3) * (r.width + gap)) &&
          near(r.top, g.top + Math.floor(i / 3) * (r.height + gap)),
        label + ': gaps in three-column grid',
      );
    }
  }
  report.layouts++;
}
async function save(host: HTMLElement, name: string) {
  const c = await renderCardToCanvas(host, { scale: 2.5 });
  const blob = await new Promise<Blob>((resolve) => c.toBlob((v) => resolve(v!)));
  await fetch('/__media_results/' + name + '.png', { method: 'POST', body: blob });
  assert(c.width === 1600, name + ': export lost Retina scale');
  report.exports++;
  return c;
}
async function run() {
  const large = [5, 6, 9].flatMap((n) => [
    'i'.repeat(n),
    'v'.repeat(n),
    ...Array.from({ length: n }, (_, vi) =>
      Array.from({ length: n }, (_, i) => (i === vi ? 'v' : 'i')).join(''),
    ),
  ]);
  const profiles = [
    [16 / 9, 9 / 16],
    [9 / 16, 16 / 9],
    [1, 1],
    [9 / 16, 9 / 16],
    [16 / 9, 16 / 9],
    [21 / 9, 9 / 21],
  ];
  for (const theme of themes)
    for (const context of ['main', 'native', 'reply']) {
      for (const reverse of [false, true])
        for (const pattern of [...patterns, ...large, 'v', 'i']) {
          const media = mediaFor(pattern, reverse),
            post = await contextPost(media, context),
            { host, close } = await render(post, theme);
          try {
            verify(host, media, context, `${theme}/${context}/${pattern}/${reverse}`);
            if (!reverse && ['vv', 'vvi', 'ivvv', 'viiii'].includes(pattern))
              await save(host, `${theme}-${context}-${pattern}`);
          } finally {
            close();
          }
        }
      for (const ratios of profiles)
        for (const pattern of ['vv', 'iv', 'vi', 'vvi', 'ivv', 'vivv']) {
          const media = mediaFor(pattern).map((m, i) => ({
              ...m,
              aspectRatio: ratios[i % 2],
              url: fixture(ratios[i % 2], i),
            })),
            { host, close } = await render(await contextPost(media, context), theme);
          try {
            verify(host, media, context, `${theme}/${context}/${pattern}/${ratios}`);
          } finally {
            close();
          }
        }
      for (const ratio of [undefined, 0, -1, NaN, Infinity]) {
        const media = mediaFor('vv');
        media[1].aspectRatio = ratio as any;
        const { host, close } = await render(await contextPost(media, context), theme);
        try {
          verify(host, media, context, `${theme}/${context}/invalid ${ratio}`);
        } finally {
          close();
        }
      }
      const unknown = mediaFor('vv');
      delete (unknown[1] as any).aspectRatio;
      const live = await render(await contextPost(unknown, context), theme);
      try {
        verify(live.host, unknown, context, `${theme}/${context}/before metadata`);
        for (const pattern of ['vv', 'vvi', 'iv']) {
          const media = mediaFor(pattern);
          await live.update(await contextPost(media, context));
          verify(live.host, media, context, `${theme}/${context}/updated ${pattern}`);
        }
      } finally {
        live.close();
      }
      const media = mediaFor('vvi'),
        { host, close } = await render(await contextPost(media, context), theme, ShareCard, 360);
      try {
        verify(host, media, context, `${theme}/${context}/narrow`);
      } finally {
        close();
      }
    }
  for (const theme of themes)
    for (const context of ['native', 'reply'])
      for (const [ownPattern, quotePattern] of [
        ['vv', 'vvi'],
        ['vvi', 'vv'],
      ]) {
        const own = mediaFor(ownPattern),
          quoted = mediaFor(quotePattern),
          data = { ...(await contextPost(quoted, context)), media: own },
          { host, close } = await render(data, theme);
        try {
          verify(host, own, 'main', `${theme}/${context}/own`);
          verify(host, quoted, context, `${theme}/${context}/quoted`);
          const a = host.querySelector('.qs-media-gallery')!.getBoundingClientRect(),
            b = host.querySelector(selector(context))!.getBoundingClientRect();
          assert(b.top > a.bottom, `${theme}/${context}: quote overlaps own media`);
        } finally {
          close();
        }
      }
  document.querySelector('#status')!.textContent = JSON.stringify(report);
  (window as any).report = report;
  (window as any).done = true;
  await fetch('/__media_results/report.json', { method: 'POST', body: JSON.stringify(report, null, 2) });
}
run().catch(async (e) => {
  report.failures.push(e.stack || String(e));
  (window as any).report = report;
  (window as any).done = true;
  document.querySelector('#status')!.textContent = String(e);
  await fetch('/__media_results/report.json', { method: 'POST', body: JSON.stringify(report, null, 2) });
});
