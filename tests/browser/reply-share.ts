import { createApp, nextTick } from 'vue';
import App from '@/entrypoints/content/App.vue';
import { XAdapter } from '@/adapters/x.adapter';
import type { PostData } from '@/types/post';
import { quotedRootFixture, QUOTED_ROOT_COMMENT } from '../fixtures/x-quoted-root.fixture';
import '@/assets/style.css';

// Only browser boundaries are faked: saved preferences, clipboard destination,
// and deterministic media. Adapter, App, modal, card and PNG exporter are real.
const picture = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#a8b8c8"/><text x="40" y="200" font-size="30">Comment attachment</text></svg>');
const themes = ['raycast-dark', 'liquid-glass', 'craft-editorial'];
const rootUrl = '/landiantech/status/2119727913243414747';
const commentUrl = 'https://x.com/china_TCL/status/2119765663921459555';
const report = { cases: [] as { name: string; theme: string; checkpoints: string[] }[], failures: [] as string[] };
let theme = themes[0];
let clipboard: Blob[] = [];
const storage = {
  local: {
    get: async (key: string) => ({ [key]: key === 'quickshare_last_card_theme' ? theme : undefined }),
    set: async () => {},
  },
  onChanged: { addListener() {}, removeListener() {} },
};
Object.defineProperty(window, 'chrome', { configurable: true, value: { storage } });
Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
  async write(items: ClipboardItem[]) {
    for (const item of items) clipboard.push(await item.getType('image/png'));
  },
} });

const assert = (condition: unknown, message: string) => { if (!condition) throw Error(message); };
async function until(check: () => unknown, message: string) {
  const start = performance.now();
  while (!check()) {
    if (performance.now() - start > 6000) throw Error(message);
    await new Promise(resolve => setTimeout(resolve, 20));
  }
}
function plainRoot() {
  const holder = document.createElement('div'); holder.innerHTML = quotedRootFixture();
  holder.querySelector('[role="link"][tabindex="0"]')!.remove();
  return holder.innerHTML;
}
const parent = `<article data-testid="tweet" id="intermediate">
  <div data-testid="User-Name"><a href="/parent">Parent</a></div>
  <div data-testid="tweetText">Intermediate reply</div>
  <a href="/parent/status/2119765663921459000"><time datetime="2026-11-09T12:00:00Z">Earlier</time></a><div role="group"></div></article>`;
const cases = [
  { name: 'ordinary-root', html: () => plainRoot() + QUOTED_ROOT_COMMENT, root: true },
  { name: 'quoted-root-unlinked-time', html: () => quotedRootFixture() + QUOTED_ROOT_COMMENT, root: true, quote: true },
  { name: 'quoted-root-linked-time', html: () => quotedRootFixture(true) + QUOTED_ROOT_COMMENT, root: true, quote: true },
  { name: 'root-virtualized-away', html: () => quotedRootFixture() + QUOTED_ROOT_COMMENT, root: true, quote: true, removeRoot: true },
  { name: 'comment-also-has-quote', html: () => quotedRootFixture() + QUOTED_ROOT_COMMENT.replace('<a href="/china_TCL/status/', '<div role="link" tabindex="0"><div data-testid="tweetText">Comment native quote</div><time>Old quote time</time></div><a href="/china_TCL/status/'), root: true, quote: true },
  { name: 'secondary-reply-excluded', html: () => quotedRootFixture() + parent + QUOTED_ROOT_COMMENT.replace('href="/landiantech">@landiantech', 'href="/parent">@parent'), root: false, secondary: true },
  { name: 'share-root-itself', html: () => quotedRootFixture() + QUOTED_ROOT_COMMENT, root: false, target: '#quoted-root' },
  { name: 'home-feed-unrelated-post', html: () => quotedRootFixture() + QUOTED_ROOT_COMMENT, root: false, url: '/home' },
  { name: 'navigation-clears-root-cache', html: () => quotedRootFixture() + QUOTED_ROOT_COMMENT, root: false, removeRoot: true, navigate: true },
];

async function scenario(test: typeof cases[number]) {
  const source = document.createElement('div'); source.innerHTML = test.html();
  source.querySelectorAll<HTMLImageElement>('img').forEach(img => { img.src = picture; });
  document.body.appendChild(source);
  const appHost = document.createElement('div'); document.body.appendChild(appHost);
  const adapter = new XAdapter();
  const app = createApp(App);
  const vm = app.mount(appHost) as unknown as { openShareModal(post: PostData | Promise<PostData | null>): Promise<void> };
  const originalUrl = location.href;
  let delivered: PostData | null | undefined;
  clipboard = [];
  try {
    history.replaceState(null, '', test.url || rootUrl);
    adapter.start(post => {
      void Promise.resolve(post).then(value => { delivered = value; });
      void vm.openShareModal(post);
    });
    if (test.navigate) history.replaceState(null, '', '/other/status/9999999');
    if (test.removeRoot) source.querySelector('#quoted-root')!.remove();
    await nextTick();
    const button = source.querySelector<HTMLButtonElement>(`${test.target || '#quoted-root-comment'} .quick-share-x-wrapper button`);
    assert(button, 'share button was not injected');
    button!.click();
    await until(() => delivered, 'share button did not deliver extracted data');
    assert(!!delivered!.contextThread?.rootPost === (test.root || !!test.secondary), 'wrong root in adapter callback');
    assert(!!delivered!.contextThread?.parentPost === !!test.secondary, 'wrong reply depth');
    const sourceCard = () => appHost.querySelector('.render-source .qs-card-wrapper');
    await until(() => sourceCard()?.getAttribute('data-theme') === theme, 'real App/modal did not mount the export source with the saved theme');
    const card = sourceCard()!;
    assert(card.getAttribute('data-theme') === theme, 'saved theme was not restored');
    assert(!!card.querySelector('.qs-reply-quote') === test.root, 'root missing or wrongly added in card');
    const footer = card.querySelector('.qs-footer-url');
    if (!test.target) assert(footer?.getAttribute('title') === commentUrl, 'footer no longer points to the comment');
    if (test.root) {
      assert(card.querySelector('.qs-reply-quote > .quick-share-quote-text')?.textContent?.includes('只要你的脸皮够'), 'root text missing');
      assert(card.querySelector('.qs-reply-quote time')?.getAttribute('datetime') === '2026-11-09T09:44:51.000Z', 'root borrowed quote timestamp');
      assert(card.querySelector('.qs-media-gallery')!.compareDocumentPosition(card.querySelector('.qs-reply-quote')!) & Node.DOCUMENT_POSITION_FOLLOWING, 'root was placed above comment attachment');
      if (test.quote) assert(card.querySelector('.qs-reply-native-quote')?.textContent?.includes('Thanks 😉'), 'root native quote missing');
    }
    await until(() => clipboard.length === 1 && appHost.querySelector('.preview-panel')?.getAttribute('aria-busy') === 'false', 'real preview PNG / automatic copy did not finish');
    const preview = appHost.querySelector<HTMLImageElement>('.preview-image img')!;
    await preview.decode();
    const automatic = await createImageBitmap(clipboard[0]);
    assert(automatic.width === 1485 && automatic.height > 400, 'invalid Retina PNG');
    assert(preview.naturalWidth === automatic.width && preview.naturalHeight === automatic.height, 'preview differs from copied PNG');
    automatic.close();
    const before = clipboard.length;
    appHost.querySelector<HTMLButtonElement>('.export-actions .secondary-button')!.click();
    await until(() => clipboard.length === before + 1, 'manual copy did not produce a PNG');
    const manual = await createImageBitmap(clipboard[before]);
    assert(manual.width === preview.naturalWidth && manual.height === preview.naturalHeight, 'manual copy differs from preview');
    manual.close();
    await fetch(`/__media_results/${theme}-${test.name}.png`, { method: 'POST', body: clipboard[before] });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await nextTick();
    assert(!appHost.querySelector('[role="dialog"]'), 'Escape did not close the real modal');
    report.cases.push({ name: test.name, theme, checkpoints: ['injected-button', 'adapter-context', 'real-app-modal', 'card-content-order', 'preview-png', 'automatic-copy-png', 'manual-copy-png', 'escape-close'] });
  } finally {
    adapter.stop(); app.unmount(); appHost.remove(); source.remove();
    history.replaceState(null, '', originalUrl);
  }
}

async function run() {
  for (theme of themes) for (const test of cases) {
    try { await scenario(test); }
    catch (error) { throw new Error(`${theme}/${test.name}: ${error instanceof Error ? error.message : error}`); }
  }
}
run().catch(error => report.failures.push(error.stack || String(error))).finally(async () => {
  document.querySelector('#status')!.textContent = JSON.stringify(report, null, 2);
  await fetch('/__media_results/report.json', { method: 'POST', body: JSON.stringify(report, null, 2) });
});
