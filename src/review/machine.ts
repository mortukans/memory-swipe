/**
 * The review state machine — the heart of the app's safety guarantees.
 *
 * Pure and synchronous: every function returns a new ReviewState and never
 * touches the Photos library, storage or the clock. That keeps the rules that
 * must never be wrong — a left swipe only ever marks an item, undo restores the
 * exact prior state, the delete queue is exactly the 'remove' set minus what was
 * actually deleted — fully unit-testable.
 *
 * Decisions:
 *   - 'keep'   : reviewed, kept. A local decision only; never favorites or
 *                duplicates the photo.
 *   - 'remove' : reviewed, queued for deletion. NOTHING is deleted until the
 *                review flow is confirmed and the system delete succeeds.
 *   - skip     : NOT a decision. Advances past the card for this session; the
 *                item stays unreviewed and can return in a later session.
 */
export type Decision = 'keep' | 'remove';
export type Action = { id: string; type: 'keep' | 'remove' | 'skip' };

export interface ReviewState {
  /** Asset ids in the fixed order of this session. */
  order: string[];
  /** Cursor: the current card is order[index]; the session is done when index === order.length. */
  index: number;
  /** Per-asset decisions made in this session. */
  decisions: Record<string, Decision>;
  /** Session-only: ids advanced past without a decision. Never persisted as reviewed. */
  skipped: string[];
  /** Ids confirmed deleted from the library this session (for the result screen). */
  deleted: string[];
  /** Action stack enabling a single-step undo of keep/remove/skip. */
  history: Action[];
}

export function createReview(order: string[]): ReviewState {
  return { order, index: 0, decisions: {}, skipped: [], deleted: [], history: [] };
}

export const currentId = (s: ReviewState): string | undefined =>
  s.index < s.order.length ? s.order[s.index] : undefined;

export const isComplete = (s: ReviewState): boolean => s.index >= s.order.length;

/** Record keep/remove for the current card and advance. No-op when the session is done. */
export function decide(s: ReviewState, decision: Decision): ReviewState {
  const id = currentId(s);
  if (id === undefined) return s;
  return {
    ...s,
    index: s.index + 1,
    decisions: { ...s.decisions, [id]: decision },
    // leaving a card un-skips it if it had been skipped earlier and revisited
    skipped: s.skipped.filter((x) => x !== id),
    history: [...s.history, { id, type: decision }],
  };
}

/** Advance past the current card without reviewing it. No-op when the session is done. */
export function skip(s: ReviewState): ReviewState {
  const id = currentId(s);
  if (id === undefined) return s;
  const already = s.skipped.includes(id);
  return {
    ...s,
    index: s.index + 1,
    skipped: already ? s.skipped : [...s.skipped, id],
    history: [...s.history, { id, type: 'skip' }],
  };
}

/** Reverse the most recent keep/remove/skip. No-op with empty history. */
export function undo(s: ReviewState): ReviewState {
  const last = s.history[s.history.length - 1];
  if (!last) return s;
  const decisions = { ...s.decisions };
  let skipped = s.skipped;
  if (last.type === 'skip') skipped = s.skipped.filter((x) => x !== last.id);
  else delete decisions[last.id];
  return {
    ...s,
    index: Math.max(0, s.index - 1),
    decisions,
    skipped,
    history: s.history.slice(0, -1),
  };
}

export const canUndo = (s: ReviewState): boolean => s.history.length > 0;

// ─── derived views ───────────────────────────────────────────────────────────

/** Ids queued for deletion: decided 'remove' and not yet actually deleted. */
export function removeIds(s: ReviewState): string[] {
  const del = new Set(s.deleted);
  return Object.keys(s.decisions).filter((id) => s.decisions[id] === 'remove' && !del.has(id));
}

export const keepIds = (s: ReviewState): string[] =>
  Object.keys(s.decisions).filter((id) => s.decisions[id] === 'keep');

export const reviewedCount = (s: ReviewState): number => Object.keys(s.decisions).length;

export interface ReviewCounts {
  reviewed: number;
  kept: number;
  queued: number;
  skipped: number;
  deleted: number;
}

export function counts(s: ReviewState): ReviewCounts {
  return {
    reviewed: reviewedCount(s),
    kept: keepIds(s).length,
    queued: removeIds(s).length,
    skipped: s.skipped.length,
    deleted: s.deleted.length,
  };
}

// ─── review-screen edits (not part of the swipe/undo history) ────────────────

/**
 * Pull one item out of the deletion queue from the review screen: it becomes a
 * kept, reviewed item (so it won't resurface). Safe to call on any id.
 */
export function pullFromQueue(s: ReviewState, id: string): ReviewState {
  if (s.decisions[id] !== 'remove') return s;
  return { ...s, decisions: { ...s.decisions, [id]: 'keep' } };
}

/** Empty the whole deletion queue: every queued item becomes kept. Deletes nothing. */
export function clearQueue(s: ReviewState): ReviewState {
  const decisions = { ...s.decisions };
  for (const id of removeIds(s)) decisions[id] = 'keep';
  return { ...s, decisions };
}

/**
 * Apply the outcome of a confirmed deletion. `deletedIds` are the assets the
 * system actually removed; anything not in that set stays queued (cancelled,
 * failed, or unavailable) so the UI never shows a false success.
 */
export function markDeleted(s: ReviewState, deletedIds: string[]): ReviewState {
  const decisions = { ...s.decisions };
  const already = new Set(s.deleted);
  const deleted = [...s.deleted];
  for (const id of deletedIds) {
    // Only items that were actually queued for deletion count as deleted.
    if (decisions[id] === 'remove') {
      delete decisions[id];
      if (!already.has(id)) {
        deleted.push(id);
        already.add(id);
      }
    }
  }
  return { ...s, decisions, deleted };
}
