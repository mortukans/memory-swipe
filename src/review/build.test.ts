import { describe, expect, it } from 'vitest';
import type { MediaItem } from '../media/types';
import { buildSessionOrder } from './build';

function item(id: string, fav = false): MediaItem {
  return { id, kind: 'photo', creationTime: 1, modificationTime: 1, durationSec: null, width: 1, height: 1, isFavorite: fav };
}

const base = { includeFavorites: false, reviewedIds: new Set<string>(), shuffle: false };

describe('buildSessionOrder', () => {
  it('excludes already-reviewed ids (cross-collection consistency)', () => {
    const order = buildSessionOrder([item('a'), item('b'), item('c')], {
      ...base,
      reviewedIds: new Set(['b']),
    });
    expect(order).toEqual(['a', 'c']);
  });

  it('drops favorites unless opted in', () => {
    const items = [item('a'), item('fav', true)];
    expect(buildSessionOrder(items, base)).toEqual(['a']);
    expect(buildSessionOrder(items, { ...base, includeFavorites: true })).toEqual(['a', 'fav']);
  });

  it('keeps input order when not shuffling', () => {
    expect(buildSessionOrder([item('a'), item('b')], base)).toEqual(['a', 'b']);
  });

  it('shuffles deterministically by seed and loses nothing', () => {
    const items = Array.from({ length: 20 }, (_, i) => item(String(i)));
    const a = buildSessionOrder(items, { ...base, shuffle: true, seed: 123 });
    const b = buildSessionOrder(items, { ...base, shuffle: true, seed: 123 });
    expect(a).toEqual(b);
    expect(a.slice().sort()).toEqual(items.map((i) => i.id).sort());
  });
});
