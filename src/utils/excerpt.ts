/** Keep only the text nearest the selection; never rewrite the selected HTML. */
export function compactExcerptContext(
  html: string,
  side: 'before' | 'after',
  limit = 64,
  preserveBoundary = false
): string {
  const root = document.createElement('div');
  root.innerHTML = html;
  root
    .querySelectorAll('img, video, svg, canvas, iframe, button')
    .forEach((node) => node.remove());

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) =>
        node.nodeType === Node.TEXT_NODE || (node as Element).tagName === 'BR'
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP,
    }
  );
  const units: { node: Node; start: number; end: number; text: string }[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) {
      let offset = 0;
      for (const text of node.textContent || '') {
        units.push({ node, start: offset, end: offset + text.length, text });
        offset += text.length;
      }
    } else {
      const parent = node.parentNode!;
      const index = Array.from(parent.childNodes).indexOf(node as ChildNode);
      units.push({ node: parent, start: index, end: index + 1, text: '\n' });
    }
  }
  // Trim empty lines at the selection boundary before applying the budget.
  let leading = '';
  let trailing = '';
  while (units.length && !units[0].text.trim()) leading += units.shift()!.text;
  while (units.length && !units[units.length - 1].text.trim())
    trailing = units.pop()!.text + trailing;
  const boundary = side === 'before' ? trailing : leading;
  const separator =
    preserveBoundary && boundary
      ? boundary.includes('\n')
        ? '<br>'
        : ' '
      : '';

  const ordered = side === 'before' ? [...units].reverse() : units;
  let lineBreaks = 0;
  const kept: typeof units = [];
  for (const unit of ordered) {
    if (
      kept.length >= limit - (separator ? 1 : 0) ||
      (unit.text === '\n' && ++lineBreaks > 1)
    )
      break;
    kept.push(unit);
  }
  if (!kept.length) return '';
  if (side === 'before') kept.reverse();
  const range = document.createRange();
  range.setStart(kept[0].node, kept[0].start);
  const last = kept[kept.length - 1];
  range.setEnd(last.node, last.end);
  const fragment = range.cloneContents();
  // Preserve the common ancestor's formatting when both boundaries are inside it.
  const ancestor = range.commonAncestorContainer;
  const wrapper =
    ancestor.nodeType === Node.TEXT_NODE
      ? ancestor.parentElement
      : (ancestor as Element);
  let result: Node = fragment;
  for (
    let element = wrapper;
    element && element !== root;
    element = element.parentElement
  ) {
    const clone = element.cloneNode(false);
    clone.appendChild(result);
    result = clone;
  }
  root.replaceChildren(result);
  return side === 'before'
    ? root.innerHTML + separator
    : separator + root.innerHTML;
}

export function compactInlineExcerpt(html: string, showContext = true): string {
  const root = document.createElement('div');
  root.innerHTML = html;
  for (const [selector, side] of [
    ['.quick-share-inline-fade-in', 'before'],
    ['.quick-share-inline-fade-out', 'after'],
  ] as const) {
    root.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      if (!showContext) element.remove();
      else
        element.innerHTML = compactExcerptContext(
          element.innerHTML,
          side,
          64,
          true
        );
    });
  }
  return root.innerHTML;
}

/** Move unselected inline context outside the highlight so both sides share a two-line viewport. */
export function prepareExcerpt(html: string, before = '', after = '') {
  const root = document.createElement('div');
  root.innerHTML = html;
  let inlineBefore = '';
  let inlineAfter = '';
  root.querySelectorAll<HTMLElement>('.quick-share-inline-fade-in, .quick-share-inline-fade-out').forEach((node) => {
    if (node.classList.contains('quick-share-inline-fade-in')) inlineBefore += node.innerHTML;
    else inlineAfter += node.innerHTML;
    node.remove();
  });
  const context = (source: string, side: 'before' | 'after') => {
    const container = document.createElement('div');
    container.innerHTML = source;
    container.querySelectorAll('img, video, svg, canvas, iframe, button').forEach((node) => node.remove());
    container.querySelectorAll('br').forEach((node) => node.replaceWith('\n'));
    container.querySelectorAll('p, section, div, li, blockquote, h1, h2, h3, h4').forEach((node) => node.append('\n'));
    // Collapse empty lines in decorative context, retaining real paragraph boundaries.
    const text = (container.textContent || '').split('\n').map((line) => line.trim()).filter(Boolean).join('\n');
    const chars = Array.from(text);
    container.textContent = (side === 'before' ? chars.slice(-512) : chars.slice(0, 512)).join('');
    return container.innerHTML;
  };
  return {
    content: root.innerHTML,
    before: context(before + inlineBefore, 'before'),
    after: context(inlineAfter + after, 'after'),
  };
}
