import { describe, expect, it } from 'vitest';
import {
  canUndo,
  clearQueue,
  counts,
  createReview,
  currentId,
  decide,
  isComplete,
  markDeleted,
  pullFromQueue,
  removeIds,
  skip,
  undo,
} from './machine';

const ids = ['a', 'b', 'c', 'd'];

describe('review machine', () => {
  it('starts at the first card and is not complete', () => {
    const s = createReview(ids);
    expect(currentId(s)).toBe('a');
    expect(isComplete(s)).toBe(false);
    expect(canUndo(s)).toBe(false);
  });

  it('left swipe (remove) only queues - nothing is deleted', () => {
    let s = createReview(ids);
    s = decide(s, 'remove'); // a
    expect(removeIds(s)).toEqual(['a']);
    expect(s.deleted).toEqual([]);
    expect(currentId(s)).toBe('b');
  });

  it('keep/remove/skip advance the cursor without repeats', () => {
    let s = createReview(ids);
    s = decide(s, 'keep'); // a
    s = decide(s, 'remove'); // b
    s = skip(s); // c
    expect(currentId(s)).toBe('d');
    expect(counts(s)).toMatchObject({ reviewed: 2, kept: 1, queued: 1, skipped: 1 });
  });

  it('undo restores the exact prior state for each action type', () => {
    let s = createReview(ids);
    const s0 = s;
    s = decide(s, 'remove'); // a queued
    s = undo(s);
    expect(s).toEqual(s0);

    s = skip(s); // a skipped
    expect(s.skipped).toEqual(['a']);
    s = undo(s);
    expect(s.skipped).toEqual([]);
    expect(currentId(s)).toBe('a');
  });

  it('undo is a no-op with empty history and never goes below zero', () => {
    const s = createReview(ids);
    expect(undo(s)).toEqual(s);
  });

  it('completes after the last card and ignores further actions', () => {
    let s = createReview(['x']);
    s = decide(s, 'keep');
    expect(isComplete(s)).toBe(true);
    expect(currentId(s)).toBeUndefined();
    const after = decide(s, 'remove');
    expect(after).toEqual(s); // no-op past the end
  });

  it('pullFromQueue turns a queued item into a kept one', () => {
    let s = createReview(ids);
    s = decide(s, 'remove'); // a queued
    s = pullFromQueue(s, 'a');
    expect(removeIds(s)).toEqual([]);
    expect(counts(s).kept).toBe(1);
  });

  it('clearQueue keeps every queued item and deletes nothing', () => {
    let s = createReview(ids);
    s = decide(s, 'remove');
    s = decide(s, 'remove');
    expect(removeIds(s).length).toBe(2);
    s = clearQueue(s);
    expect(removeIds(s)).toEqual([]);
    expect(s.deleted).toEqual([]);
  });

  it('markDeleted removes only confirmed ids and never reports false success', () => {
    let s = createReview(ids);
    s = decide(s, 'remove'); // a
    s = decide(s, 'remove'); // b
    s = decide(s, 'remove'); // c
    // Only a and c actually deleted (b was cancelled/failed/unavailable).
    s = markDeleted(s, ['a', 'c']);
    expect(removeIds(s)).toEqual(['b']); // b stays queued
    expect(s.deleted.slice().sort()).toEqual(['a', 'c']);
    expect(counts(s).deleted).toBe(2);
  });

  it('markDeleted is idempotent and ignores never-queued ids', () => {
    let s = createReview(ids);
    s = decide(s, 'remove'); // a
    s = markDeleted(s, ['a']);
    s = markDeleted(s, ['a', 'z']); // repeat + unknown
    expect(s.deleted).toEqual(['a']);
  });
});
