export function formatTimestampForLocale(iso: string, locale?: string): string {
  const date = new Date(iso);
  const resolvedLocale = locale ?? navigator.language;
  return date.toLocaleString(resolvedLocale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  } as Intl.DateTimeFormatOptions);
}

export function minutesAgo(iso: string, now: number = Date.now()): number {
  const ms = now - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 60000));
}


