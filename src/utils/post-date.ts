/** English display in the viewer's local timezone; date-only sources stay date-only. */
export function formatPostDate(value?: string): string {
  if (!value) return '';
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(dateOnly ? `${value}T12:00:00` : value);
  if (!Number.isFinite(date.getTime())) return '';
  const day = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  return dateOnly ? day : `${day} · ${new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(date)}`;
}

/** Only explicit source timestamps, never the current time or relative labels. */
export function extractPostDate(root: ParentNode): string | undefined {
  const candidates = root.querySelectorAll('time[datetime], [itemprop="datePublished"], [data-created-at]');
  for (const element of candidates) {
    const value = element.getAttribute('datetime') || element.getAttribute('content') || element.getAttribute('data-created-at');
    if (value && /^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value) && formatPostDate(value)) return value;
  }
  return undefined;
}
