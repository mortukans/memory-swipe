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
 *  - random sessions shuffle the WHOLE candidate set by seed and only then drop
 *    reviewed ids, so the order is stable across sessions: the remaining items
 *    keep their place, skipped items come back later, nothing repeats.
 */
export interface BuildOpts {
  includeFavorites: boolean;
  reviewedIds: Set<string>;
  shuffle: boolean;
  seed?: number;
}

export function buildSessionOrder(candidates: MediaItem[], opts: BuildOpts): string[] {
  const protectedList = applyFavoriteProtection(candidates, opts.includeFavorites);
  const ids = protectedList.map((i) => i.id);
  const ordered = opts.shuffle && opts.seed != null ? seededShuffle(ids, opts.seed) : ids;
  return ordered.filter((id) => !opts.reviewedIds.has(id));
}
