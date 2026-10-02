import { applyFavoriteProtection, seededShuffle } from '../collections';
import type { MediaItem } from '../media/types';

/**
 * Turn a set of candidate items (already scoped to a collection's domain, e.g.
 * one month, one album, or all videos) into the ordered id list for a review
 * session. Pure and testable.
 *
 * Rules applied here:
 *  - favorites are dropped unless the user opted in (protection),
 *  - anything already reviewed (kept, queued, or deleted) is excluded, so a
 *    decision in one collection is reflected in every overlapping collection,
 *  - random sessions are shuffled by seed → the same seed replays the same
 *    order with no repeats, which is what makes a random session resumable.
 */
export interface BuildOpts {
  includeFavorites: boolean;
  reviewedIds: Set<string>;
  shuffle: boolean;
  seed?: number;
}

export function buildSessionOrder(candidates: MediaItem[], opts: BuildOpts): string[] {
  const kept = applyFavoriteProtection(candidates, opts.includeFavorites).filter(
    (i) => !opts.reviewedIds.has(i.id),
  );
  const ids = kept.map((i) => i.id);
  return opts.shuffle && opts.seed != null ? seededShuffle(ids, opts.seed) : ids;
}
