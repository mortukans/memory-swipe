/** Locale-aware labels. All user-facing dates and counts go through here. */

export function monthLabel(lang: string, year: number, month: number): string {
  return new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
}

export function monthName(lang: string, month: number): string {
  const s = new Intl.DateTimeFormat(lang, { month: 'long' }).format(new Date(2000, month - 1, 1));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function dateLabel(lang: string, ms: number | null): string {
  if (ms == null) return '';
  return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(ms));
}

export function durationLabel(sec: number | null): string {
  if (sec == null) return '';
  const s = Math.round(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function countLabel(lang: string, n: number): string {
  return new Intl.NumberFormat(lang).format(n);
}
