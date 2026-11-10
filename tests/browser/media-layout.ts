import { createApp, nextTick, h, shallowRef } from 'vue';
import ShareCard from '@/components/card/ShareCard.vue';
import { XAdapter } from '@/adapters/x.adapter';
import { renderCardToCanvas } from '@/utils/exporter';
import { prepareOriginalMedia } from '@/utils/media-fit';
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
      video.getBoundingClientRect = () => ({ width: m.displayAspectRatio ? 300 : 0, height: m.displayAspectRatio ? 300 / m.displayAspectRatio : 0 }) as DOMRect;
    }
  const photos=[...entity.querySelectorAll('[data-testid="tweetPhoto"] img')];let pi=0;
  for(const m of media)if(m.type==='image'){
    const image=photos[pi++] as HTMLImageElement;
    if(m.displayAspectRatio){Object.defineProperties(image,{naturalWidth:{value:m.aspectRatio*900},naturalHeight:{value:900}});}
    image.parentElement!.getBoundingClientRect=()=>({width:m.displayAspectRatio?300:0,height:m.displayAspectRatio?300/m.displayAspectRatio:0} as DOMRect);
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
  for (const grid of host.querySelectorAll('.qs-media-gallery, .quick-share-quote-media-grid')) {
    assert(grid.classList.contains('qs-media-original'), name+': original layout missing');
    for (const image of grid.querySelectorAll('img')) {
      const r=image.getBoundingClientRect();
      assert(Math.abs(r.width/r.height-(Number(image.dataset.qsDisplayRatio)||image.naturalWidth/image.naturalHeight))<.02, name+': cropped or distorted attachment');
    }
  }

  const blob = await new Promise<Blob>((resolve) => c.toBlob((v) => resolve(v!)));
  await fetch('/__media_results/' + name + '.png', { method: 'POST', body: blob });
  const outer = host.querySelector('.qs-card-wrapper')!.getBoundingClientRect();
  const card = host.querySelector('.qs-card')!.getBoundingClientRect();
  const insets = [card.left - outer.left, outer.right - card.right, card.top - outer.top, outer.bottom - card.bottom];
  assert(insets.every(inset => near(inset, insets[0])), name + ': unequal outer margins');
  const header = host.querySelector('.qs-card-header')!.getBoundingClientRect();
  const content = (host.querySelector('.qs-card-content') || host.querySelector('.qs-media-gallery'))!.getBoundingClientRect();
  assert(near(content.top - header.bottom, 12), name + ': extra header-to-content gap');
  const footer = host.querySelector('.qs-card-footer')!;
  const previous = footer.previousElementSibling!;
  const lastBlock = previous.matches('.qs-native-quote') ? previous.querySelector('.quick-share-quote-tweet')! : previous;
  assert(near(footer.getBoundingClientRect().top - lastBlock.getBoundingClientRect().bottom, 12), name + ': extra footer gap');
  assert(Math.abs(c.width - outer.width * 2.5) <= 1, name + ': export lost Retina scale');
  report.exports++;
  return c;
}
async function run() {
  for (const theme of themes) {
    const { host, close } = await render({ ...base, content: '', media: mediaFor('ii') }, theme);
    try {
      assert(!host.querySelector('.qs-card-content'), 'attachment-only post has an empty body');
      await save(host, `${theme}-attachment-only`);
      report.layouts++;
    } finally { close(); }
  }
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
  // Verify complete document images in compact source-proportional rows.
  const documentImage =
    'data:image/svg+xml;base64,' +
    btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="1200"><rect width="600" height="1200" fill="white"/>${Array.from({ length: 70 }, (_, y) => Array.from({ length: 24 }, (_, x) => `<rect x="${x * 24 + 12}" y="${y * 16 + 20}" width="10" height="5" fill="#222"/>`).join('')).join('')}<rect x="0" y="1180" width="600" height="20" fill="#4b88cc"/></svg>`,
    );
  for (const theme of themes)
    for (const context of ['main', 'native', 'reply']) {
      const media = mediaFor('vii');
      media[1].url = documentImage;
      media[2].url = documentImage + '#second';
      const { host, close } = await render(await contextPost(media, context), theme);
      try {
        await save(host, `${theme}-${context}-document`);
        const gallery = host.querySelector(selector(context))!;
        assert(gallery.classList.contains('qs-media-original'), `${theme}/${context}: document not expanded`);
        const images = [...gallery.querySelectorAll('img')];
        for (const image of images) {
          const r = image.getBoundingClientRect();
          assert(
            Math.abs(r.width / r.height - image.naturalWidth / image.naturalHeight) < 0.01,
            'document was cropped',
          );
        }
        const first = images[0].getBoundingClientRect(),
          second = images[1].getBoundingClientRect(),
          third = images[2].getBoundingClientRect();
        assert(second.left >= first.right - 1, 'first pair must share a compact row');
        assert(third.top >= Math.max(first.bottom, second.bottom), 'third attachment must wrap');
        assert(near(third.left, first.left), 'last attachment must align left');
        report.layouts++;
      } finally {
        close();
      }
    }
  for(const theme of themes)for(const context of ['main','native','reply']){
    const media=[3410/1974,2864/1826].map((ratio,i)=>({type:'image',url:fixture(ratio,i),aspectRatio:ratio,displayAspectRatio:1}));
    const {host,close}=await render(await contextPost(media,context),theme);
    try{
      await save(host,`${theme}-${context}-site-frame`);
      const grid=host.querySelector(selector(context))!;
      const images=[...grid.querySelectorAll('img')];
      assert(images.length===2,'missing site-frame image');
      for(const image of images){const r=image.getBoundingClientRect();assert(near(r.width,r.height),'lost near-square site frame');assert(getComputedStyle(image).objectFit==='cover','site frame stretched bitmap');}
      report.layouts++;
    }finally{close();}
  }
  // X's carousel frames can be square even when files are landscape. All
  // photo/video permutations must keep those frames and wrap after two tiles.
  for (const theme of themes) for (const context of ['main', 'native', 'reply'])
    for (const pattern of ['i', 'v', ...patterns]) {
      const media = [...pattern].map((type, i) => ({
        type: type === 'v' ? 'video' : 'image', url: fixture(i % 2 ? .6 : 1.8, i),
        aspectRatio: i % 2 ? .6 : 1.8, displayAspectRatio: i % 2 ? .9 : 1,
        ...(type === 'v' ? { duration: '0:12' } : {}),
      }));
      const { host, close } = await render(await contextPost(media, context), theme);
      try {
        await prepareOriginalMedia(host, async src => src);
        const gallery = host.querySelector(selector(context))!;
        const images = [...gallery.querySelectorAll('img')];
        assert(images.length === media.length, 'missing carousel tile');
        for (let i = 0; i < images.length; i++) {
          const bounds = images[i].getBoundingClientRect();
          assert(Math.abs(bounds.width / bounds.height - media[i].displayAspectRatio) < .01, `${theme}/${context}/${pattern}/${i}: lost source-page frame ratio`);
          assert(getComputedStyle(images[i]).objectFit === 'cover', `${theme}/${context}/${pattern}/${i}: frame bitmap was stretched`);
          if (i >= 2) {
            assert(bounds.top >= images[i - 2].getBoundingClientRect().bottom, 'more than two tiles on a row');
          }
          if (i % 2 === 0) assert(near(bounds.left, gallery.getBoundingClientRect().left), 'row not left aligned');
          const badge = images[i].closest('.qs-video-media-item')?.querySelector('.qs-video-play-badge');
          if (badge) {
            const b = badge.getBoundingClientRect();
            assert(near((b.left + b.right) / 2, (bounds.left + bounds.right) / 2)
              && near((b.top + b.bottom) / 2, (bounds.top + bounds.bottom) / 2), 'video badge outside its frame');
          }
        }
        if (['iii', 'viv', 'ivvi'].includes(pattern)) await save(host, `${theme}-${context}-carousel-${pattern}`);
        report.layouts++;
      } finally { close(); }
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
