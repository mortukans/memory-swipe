import { describe, expect, it } from 'vitest';
import type { MediaItem } from '../media/types';
import {
  applyFavoriteProtection,
  computeProgress,
  groupByMonth,
  hashSeed,
  longVideos,
  monthKeyOf,
  onlyKind,
  seededShuffle,
  shortVideos,
  videoLength,
} from './index';

function photo(id: string, when: number | null, fav = false): MediaItem {
  return {
    id,
    kind: 'photo',
    creationTime: when,
    modificationTime: when,
    durationSec: null,
    width: 100,
    height: 100,
    isFavorite: fav,
  };
}
function video(id: string, sec: number | null): MediaItem {
  const t = new Date(2026, 5, 15, 12).getTime();
  return { id, kind: 'video', creationTime: t, modificationTime: t, durationSec: sec, width: 100, height: 100, isFavorite: false };
}

describe('month grouping', () => {
  it('buckets by local year+month and sorts newest first, Unknown last', () => {
    const items = [
      photo('sep', new Date(2026, 8, 10, 12).getTime()),
      photo('aug', new Date(2026, 7, 10, 12).getTime()),
      photo('sep2', new Date(2026, 8, 20, 12).getTime()),
      photo('none', null),
      photo('jan25', new Date(2025, 0, 5, 12).getTime()),
    ];
    const groups = groupByMonth(items);
    expect(groups.map((g) => g.key)).toEqual(['2026-09', '2026-08', '2025-01', 'unknown']);
    expect(groups[0].items.map((i) => i.id).sort()).toEqual(['sep', 'sep2']);
    expect(groups[3].year).toBeNull();
  });

  it('separates the same month across different years', () => {
    const g = groupByMonth([
      photo('a', new Date(2025, 8, 10, 12).getTime()),
      photo('b', new Date(2026, 8, 10, 12).getTime()),
    ]);
    expect(g.map((x) => x.key)).toEqual(['2026-09', '2025-09']);
  });

  it('marks missing dates as unknown', () => {
    expect(monthKeyOf(photo('x', null))).toBe('unknown');
  });
});

describe('duration classification', () => {
  it('uses non-overlapping semantics: <= 30s short, > 30s long', () => {
    expect(videoLength(video('a', 29.9))).toBe('short');
    expect(videoLength(video('b', 30))).toBe('short');
    expect(videoLength(video('c', 30.1))).toBe('long');
  });
  it('never classifies an unknown duration as short', () => {
    expect(videoLength(video('d', null))).toBe('unknown');
    expect(shortVideos([video('d', null)])).toEqual([]);
    expect(longVideos([video('d', null)])).toEqual([]);
  });
  it('photos are never short/long videos', () => {
    expect(videoLength(photo('p', 0))).toBe('unknown');
  });
});

describe('favorite protection', () => {
  it('excludes favorites by default and includes them on opt-in', () => {
    const items = [photo('a', 1), photo('b', 2, true)];
    expect(applyFavoriteProtection(items, false).map((i) => i.id)).toEqual(['a']);
    expect(applyFavoriteProtection(items, true).length).toBe(2);
  });
});

describe('kind filter', () => {
  it('splits photos and videos', () => {
    const items = [photo('a', 1), video('v', 10)];
    expect(onlyKind(items, 'photo').map((i) => i.id)).toEqual(['a']);
    expect(onlyKind(items, 'video').map((i) => i.id)).toEqual(['v']);
  });
});

describe('seeded shuffle', () => {
  it('is deterministic for a given seed and a permutation of the input', () => {
    const xs = Array.from({ length: 50 }, (_, i) => i);
    const seed = hashSeed('session-1');
    const a = seededShuffle(xs, seed);
    const b = seededShuffle(xs, seed);
    expect(a).toEqual(b); // resumable: same seed -> same order
    expect(a).not.toEqual(xs); // actually shuffled
    expect(a.slice().sort((p, q) => p - q)).toEqual(xs); // no items lost or duplicated
  });
  it('different seeds give different orders', () => {
    const xs = Array.from({ length: 50 }, (_, i) => i);
    expect(seededShuffle(xs, hashSeed('one'))).not.toEqual(seededShuffle(xs, hashSeed('two')));
  });
});

describe('progress', () => {
  it('clamps and computes fraction', () => {
    expect(computeProgress(10, 3)).toEqual({ total: 10, reviewed: 3, remaining: 7, fraction: 0.3 });
    expect(computeProgress(0, 0).fraction).toBe(0);
    expect(computeProgress(5, 99)).toMatchObject({ reviewed: 5, remaining: 0 });
  });
});
