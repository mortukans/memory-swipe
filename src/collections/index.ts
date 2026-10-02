import type { MediaItem, MediaKind } from '../media/types';

/**
 * Pure collection logic: grouping, filtering, ordering and progress.
 *
 * Nothing here touches the native Photos API — it all operates on arrays of
 * MediaItem. That keeps the product rules (how months are grouped, what counts
 * as a short video, how a random session is ordered) fully unit-testable.
 */

/** Product default, not an iOS category. Videos of at most this length are "short". */
export const DEFAULT_SHORT_VIDEO_MAX_SEC = 30;

/** A session is at most this many items (fewer when the scope has fewer left). */
export const SESSION_SIZE = 20;

export type CollectionKind =
  | 'random'
  | 'month'
  | 'album'
  | 'photos'
  | 'videos'
  | 'short-videos'
  | 'long-videos';

/** Stable identifier for a collection, e.g. "month:2026-09" or "album:ABC123". */
export interface CollectionRef {
  kind: CollectionKind;
  /** Opaque id unique within a kind; '' for the singletons (random/photos/videos/…). */
  key: string;
}

export const collectionId = (c: CollectionRef): string => (c.key ? `${c.kind}:${c.key}` : c.kind);

// ─── month grouping ──────────────────────────────────────────────────────────

export interface MonthBucket {
  /** "YYYY-MM" for a dated month, or "unknown" for items with no capture date. */
  key: string;
  /** null/null for the unknown bucket. month is 1-12. */
  year: number | null;
  month: number | null;
  items: MediaItem[];
}

const UNKNOWN_MONTH = 'unknown';

/** Local-time year/month of an item, or null when it has no creation date. */
export function monthKeyOf(item: MediaItem): string {
  if (item.creationTime == null) return UNKNOWN_MONTH;
  const d = new Date(item.creationTime);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
}

/** Group items into months, newest first; the Unknown-date bucket always comes last. */
export function groupByMonth(items: MediaItem[]): MonthBucket[] {
  const byKey = new Map<string, MediaItem[]>();
  for (const it of items) {
    const k = monthKeyOf(it);
    const arr = byKey.get(k);
    if (arr) arr.push(it);
    else byKey.set(k, [it]);
  }
  const buckets: MonthBucket[] = [];
  for (const [key, bucketItems] of byKey) {
    if (key === UNKNOWN_MONTH) {
      buckets.push({ key, year: null, month: null, items: bucketItems });
    } else {
      const [y, m] = key.split('-').map(Number);
      buckets.push({ key, year: y, month: m, items: bucketItems });
    }
  }
  buckets.sort((a, b) => {
    if (a.key === UNKNOWN_MONTH) return 1;
    if (b.key === UNKNOWN_MONTH) return -1;
    return b.year! - a.year! || b.month! - a.month!;
  });
  return buckets;
}

// ─── kind / favorite / duration filters ──────────────────────────────────────

export const onlyKind = (items: MediaItem[], kind: MediaKind): MediaItem[] =>
  items.filter((i) => i.kind === kind);

/** Drop favorites unless the user opted to include them. Favorites are protected by default. */
export const applyFavoriteProtection = (items: MediaItem[], includeFavorites: boolean): MediaItem[] =>
  includeFavorites ? items : items.filter((i) => !i.isFavorite);

export type VideoLength = 'short' | 'long' | 'unknown';

/**
 * Non-overlapping semantics: short = duration ≤ threshold, long = duration > threshold.
 * A video with no known duration is "unknown" — it never silently counts as short.
 */
export function videoLength(item: MediaItem, shortMaxSec = DEFAULT_SHORT_VIDEO_MAX_SEC): VideoLength {
  if (item.kind !== 'video') return 'unknown';
  if (item.durationSec == null) return 'unknown';
  return item.durationSec <= shortMaxSec ? 'short' : 'long';
}

export const shortVideos = (items: MediaItem[], shortMaxSec = DEFAULT_SHORT_VIDEO_MAX_SEC): MediaItem[] =>
  items.filter((i) => videoLength(i, shortMaxSec) === 'short');

export const longVideos = (items: MediaItem[], shortMaxSec = DEFAULT_SHORT_VIDEO_MAX_SEC): MediaItem[] =>
  items.filter((i) => videoLength(i, shortMaxSec) === 'long');

// ─── deterministic random order ──────────────────────────────────────────────

/** Small, fast, well-distributed seeded PRNG (mulberry32). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Turn an arbitrary string seed into a 32-bit number (xfnv1a). */
export function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Deterministic Fisher-Yates shuffle. Same (ids, seed) always yields the same
 * order, so a random session can be persisted as just its seed + cursor and
 * resumed exactly, with no repeats. Does not mutate the input.
 */
export function seededShuffle<T>(xs: readonly T[], seed: number): T[] {
  const out = xs.slice();
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ─── progress ────────────────────────────────────────────────────────────────

export interface Progress {
  total: number;
  reviewed: number;
  remaining: number;
  /** 0..1 */
  fraction: number;
}

export function computeProgress(total: number, reviewed: number): Progress {
  const t = Math.max(0, total);
  const r = Math.min(Math.max(0, reviewed), t);
  return { total: t, reviewed: r, remaining: t - r, fraction: t === 0 ? 0 : r / t };
}

/** Suggested session batch sizes offered on the collection screen. */
export const SESSION_BATCH_SIZES = [20, 50, 100] as const;
