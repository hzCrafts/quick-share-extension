/** Fit complete attachments into compact rows without cropping or distortion. */
export function fitMediaRows(ratios: number[], width: number, gap = 6): number[] {
  if (!Number.isFinite(width) || width <= 0 || ratios.some(r => !Number.isFinite(r) || r <= 0)) return [];
  if (ratios.length === 1) return [width];
  const columns = ratios.length === 4 ? 2 : Math.min(3, ratios.length);
  const sizes: number[] = [];
  for (let i = 0; i < ratios.length; i += columns) {
    const row = ratios.slice(i, i + columns);
    const available = Math.max(0, width - gap * (row.length - 1));
    const height = Math.min(available / row.reduce((a, b) => a + b, 0), width * .9);
    sizes.push(...row.map(r => Math.floor(height * r * 64) / 64));
  }
  return sizes;
}

async function ready(image: HTMLImageElement) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([image.decode(), new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Image decode timed out')), 4000);
    })]);
  } finally { clearTimeout(timer); }
}

export async function prepareOriginalMedia(root: HTMLElement, resolveImage: (src: string) => Promise<string>) {
  await Promise.all(Array.from(root.querySelectorAll<HTMLElement>('.qs-media-gallery, .quick-share-quote-media-grid')).map(async gallery => {
    const items = Array.from(gallery.children) as HTMLElement[];
    const ratios = await Promise.all(items.map(async item => {
      const image = item instanceof HTMLImageElement ? item : item.querySelector('img');
      if (!image) return NaN;
      const frameRatio = Number(image.dataset.qsDisplayRatio);
      if (Number.isFinite(frameRatio) && frameRatio > 0) return frameRatio;
      try { await ready(image); return image.naturalWidth / image.naturalHeight; }
      catch {
        try {
          const src = await resolveImage(image.src);
          if (!src.startsWith('data:')) return NaN;
          const safe = new Image(); safe.src = src; await ready(safe);
          return safe.naturalWidth / safe.naturalHeight;
        } catch { return NaN; }
      }
    }));
    const widths = fitMediaRows(ratios, gallery.getBoundingClientRect().width);
    gallery.classList.toggle('qs-media-original', widths.length === items.length && items.length > 0);
    items.forEach((item, i) => {
      const image = item instanceof HTMLImageElement ? item : item.querySelector('img');
      const frameRatio = Number(image?.dataset.qsDisplayRatio);
      const siteFrame = widths[i] !== undefined && Number.isFinite(frameRatio) && frameRatio > 0;
      item.classList.toggle('qs-media-site-frame', siteFrame);
      if (siteFrame) item.style.setProperty('--qs-media-height', widths[i] / frameRatio + 'px');
      else item.style.removeProperty('--qs-media-height');
      if (widths[i] !== undefined) item.style.setProperty('--qs-media-width', widths[i] + 'px');
      else item.style.removeProperty('--qs-media-width');
    });
  }));
}
