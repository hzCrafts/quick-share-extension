/** URLs copied from arbitrary pages must remain passive HTTP(S) resources. */
export function webUrl(value: string | null | undefined, base: string): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value, base);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
}

/** Preserve DOM order and typography, without inheriting host layout or behavior. */
export function sanitizeWebExcerpt(html: string, base: string): string {
  const root = document.createElement('template');
  root.innerHTML = html;
  root.content.querySelectorAll('script, style, iframe, object, embed, link, meta, base, template, noscript, input, textarea, select, button, nav, [role="navigation"], [hidden], [aria-hidden="true"], [contenteditable]:not([contenteditable="false"]), foreignObject, animate, animateMotion, animateTransform, set, use').forEach(el => el.remove());
  for (const el of root.content.querySelectorAll('*')) {
    const imageSrc = el.tagName === 'IMG'
      ? ['data-src', 'data-original', 'src'].map(attr => webUrl(el.getAttribute(attr), base)).find(Boolean)
      : undefined;
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (name === 'class') {
        const classes = attr.value.split(/\s+/).filter(c => /^(quick-share-(?:inline-fade-in|inline-fade-out|spotlight)$|language-|katex)/.test(c));
        if (classes.length) el.setAttribute(name, classes.join(' '));
        else el.removeAttribute(name);
      } else if (name === 'href' && el.tagName === 'A') {
        const href = webUrl(attr.value, base);
        if (href) el.setAttribute('href', href);
        else el.removeAttribute(name);
      } else if (name === 'style') {
        const style = (el as HTMLElement).style;
        const safe = ['font-weight', 'font-style', 'text-decoration', 'text-align', 'white-space', 'vertical-align']
          .map(prop => [prop, style?.getPropertyValue(prop)])
          .filter(([, value]) => value && !/url\s*\(|var\s*\(/i.test(value));
        el.removeAttribute('style');
        for (const [prop, value] of safe) style.setProperty(prop, value);
      } else if (!['alt', 'title', 'colspan', 'rowspan', 'start', 'reversed', 'dir', 'lang', 'viewbox', 'd', 'points', 'xmlns'].includes(name)) {
        el.removeAttribute(attr.name);
      }
    }
    if (el.tagName === 'IMG') {
      if (imageSrc) el.setAttribute('src', imageSrc);
      else el.remove();
    }
  }
  return root.innerHTML;
}
