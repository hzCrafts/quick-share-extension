import { beforeEach, describe, expect, it } from 'vitest';
import { XAdapter } from '@/adapters/x.adapter';
import { extractSelection } from '@/utils/selection';
import { prepareExcerpt } from '@/utils/excerpt';
import { mount } from '@vue/test-utils';
import ShareCard from '@/components/card/ShareCard.vue';
import type { CardRenderOptions } from '@/types/theme';

beforeEach(() => { document.body.innerHTML = ''; });

describe('article selection paragraph layout', () => {
  it('preserves stylesheet paragraph gaps across a multi-paragraph X excerpt', async () => {
    document.body.innerHTML = `<style>.article-line { display:block; margin:0 0 16px; }</style>
      <article data-testid="tweet"><div data-testid="User-Name"><a href="/author">Author</a></div>
      <div data-testid="tweetText"><div class="article-line">Before</div><div class="article-line">First selected paragraph</div><div class="article-line"><strong>Second selected paragraph</strong></div><div class="article-line">After</div></div></article>`;
    const lines = document.querySelectorAll<HTMLElement>('.article-line');
    const range = document.createRange();
    range.setStart(lines[1].firstChild!, 0);
    range.setEnd(lines[2].querySelector('strong')!.firstChild!, 25);
    const post = await extractSelection(new XAdapter(), range);
    const output = document.createElement('div');
    output.innerHTML = prepareExcerpt(post!.contentHtml!).content;
    expect(output.querySelectorAll('.article-line')).toHaveLength(2);
    for (const line of output.querySelectorAll<HTMLElement>('.article-line')) {
      expect(line.style.marginBottom).toBe('16px');
      expect(line.style.display).toBe('block');
    }
    expect(output.querySelector('strong')?.textContent).toBe('Second selected paragraph');
  });

  it('preserves paragraph layout when only text within a single paragraph is selected', async () => {
    document.body.innerHTML = `<article data-testid="tweet"><div data-testid="tweetText"><div style="display:block;margin-bottom:18px">Before selected after</div></div></article>`;
    const node = document.querySelector('[style]')!.firstChild!;
    const range = document.createRange(); range.setStart(node, 7); range.setEnd(node, 15);
    const post = await extractSelection(new XAdapter(), range);
    const output = document.createElement('div'); output.innerHTML = post!.contentHtml!;
    expect(output.firstElementChild?.getAttribute('style')).toContain('margin-bottom: 18px');
  });
});


describe('nested article spacing through selection, adapter and card', () => {
  const options: CardRenderOptions = {
    themeId: 'raycast-dark', showOuterPadding: true, padding: 24,
    showQrCode: false, showWatermark: false, showStats: false,
    fontScale: 1, cardRadius: 16, authorAvatarRadius: 'rounded-full', aspectRatio: 'auto',
  };

  it.each(['margin-bottom', 'padding-bottom'])(
    'retains %s on the outer paragraph wrapper without inventing extra br', async prop => {
      document.body.innerHTML = `<style>
        .editor-block { display:block; ${prop}:20px; }
        .public-DraftStyleDefault-block { display:block; margin:0; }
      </style><article data-testid="tweet"><div data-testid="tweetText">
        <div class="editor-block" data-block="true"><div class="public-DraftStyleDefault-block"><span>First paragraph</span></div></div>
        <div class="editor-block" data-block="true"><div class="public-DraftStyleDefault-block"><strong>Second paragraph</strong></div></div>
      </div></article>`;
      const range = document.createRange();
      const first = document.querySelector('.editor-block span')!.firstChild!;
      const last = document.querySelector('.editor-block strong')!.firstChild!;
      range.setStart(first, 2); range.setEnd(last, last.textContent!.length - 2);
      const post = await extractSelection(new XAdapter(), range);
      // Remove the host stylesheet: the exported card must be self-contained.
      document.querySelector('style')!.remove();
      const card = mount(ShareCard, { props: { post: post!, options } });
      const blocks = card.findAll<HTMLElement>('.quick-share-rich-body .editor-block');
      expect(blocks).toHaveLength(2);
      expect(blocks.map(block => block.element.style.getPropertyValue(prop))).toEqual(['20px', '20px']);
      expect(blocks[0].text()).toBe('rst paragraph');
      expect(blocks[1].find('strong').text()).toBe('Second paragra');
      expect(card.findAll('.quick-share-rich-body .public-DraftStyleDefault-block').every(block =>
        (block.element as HTMLElement).style.marginBottom === '0px')).toBe(true);
      expect(card.findAll('.quick-share-rich-body br')).toHaveLength(0);
      card.unmount();
    }
  );

  it('retains a shared column gap when Range omits the common parent', async () => {
    document.body.innerHTML = `<article data-testid="tweet"><div data-testid="tweetText" style="display:flex;flex-direction:column;row-gap:24px;padding:40px">
      <div><span>First</span></div><div><strong>Second</strong></div>
    </div></article>`;
    const range = document.createRange();
    range.setStart(document.querySelector('span')!.firstChild!, 0);
    range.setEnd(document.querySelector('strong')!.firstChild!, 6);
    const post = await extractSelection(new XAdapter(), range);
    const card = mount(ShareCard, { props: { post: post!, options } });
    const flow = card.find<HTMLElement>('.quick-share-rich-body > div');
    expect(flow.element.style.display).toBe('flex');
    expect(flow.element.style.flexDirection).toBe('column');
    expect(flow.element.style.rowGap).toBe('24px');
    expect(flow.element.style.padding).toBe('');
    expect(flow.element.children).toHaveLength(2);
    card.unmount();
  });

  it('keeps blank spacer blocks while omitting fixed heights from text and images', async () => {
    document.body.innerHTML = `<style>.fixed-text { display:block; height:100px; }</style><article data-testid="tweet"><div data-testid="tweetText"><div class="fixed-text">First</div><div style="height:22px"></div><div><img src="https://example.com/a.png">Second</div></div></article>`;
    const root = document.querySelector<HTMLElement>('[data-testid="tweetText"]')!;
    const range = document.createRange(); range.selectNodeContents(root);
    const post = await extractSelection(new XAdapter(), range);
    const output = document.createElement('div'); output.innerHTML = post!.contentHtml!;
    expect((output.children[1] as HTMLElement).style.height).toBe('22px');
    expect((output.children[0] as HTMLElement).style.height).toBe('');
    expect(output.querySelector('img')).not.toBeNull();
    expect(Array.from(output.children).map(el => el.textContent)).toEqual(['First', '', 'Second']);
  });
});
