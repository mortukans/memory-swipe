import { create } from 'zustand';
import {
  SESSION_SIZE,
  collectionId as collectionIdOf,
  hashSeed,
  longVideos,
  onlyKind,
  shortVideos,
  type CollectionRef,
} from '../collections';
import type { MediaItem, MediaPreview } from '../media/types';
import { buildSessionOrder } from '../review/build';
import { createReview, currentId, decide, skip as skipCard, undo as undoCard, type Decision, type ReviewState } from '../review/machine';
import { media, storage } from './instances';
import { useLibrary } from './library';
import { useSettings } from './settings';

/** Optional media filter layered on a scope (Library chips: photos / videos / short / long). */
export type MediaFilter = 'photo' | 'video' | 'short' | 'long';

/**
 * The active swipe session. Holds the pure ReviewState plus the currently
 * resolved preview. Every keep/remove is PERSISTED BEFORE the session advances
 * (so a crash can never lose a decision the user saw commit). Skips are
 * session-only and never persisted. Nothing here deletes anything — see
 * src/state/queue.ts.
 *
 * Race safety: `startSeq` makes an overlapping start() a no-op for the older
 * call; `previewSeq` is bumped on every preview change so a slow resolve can
 * never land on a card the user has already moved past.
 */
interface SessionState {
  collection: CollectionRef | null;
  filter: MediaFilter | null;
  /** How many eligible (unreviewed) items the scope had when this session started. */
  eligible: number;
  state: ReviewState | null;
  /** id -> item for everything in this session (kind, duration, dimensions). */
  items: Record<string, MediaItem>;
  preview: MediaPreview | null;
  previewLoading: boolean;
  previewError: boolean;
  starting: boolean;
  /** Increments on every start(); screens use it to ignore stale completion. */
  generation: number;

  start: (collection: CollectionRef, filter?: MediaFilter | null) => Promise<void>;
  loadCurrentPreview: () => Promise<void>;
  retryPreview: () => Promise<void>;
  keep: () => Promise<void>;
  remove: () => Promise<void>;
  skip: () => void;
  undo: () => Promise<void>;
  reset: () => void;
}

let previewSeq = 0;
let startSeq = 0;

/** Resolved previews cached for the current session. */
const previewCache = new Map<string, MediaPreview>();

/** Storage writes are serialised so an undo can never overtake the decision it undoes. */
let writeChain: Promise<void> = Promise.resolve();
function enqueueWrite(fn: () => Promise<void>): Promise<void> {
  const next = writeChain.then(fn, fn);
  writeChain = next.catch(() => undefined);
  return next;
}

const fallbackItem = (id: string): MediaItem => ({
  id,
  kind: 'photo',
  creationTime: null,
  modificationTime: null,
  durationSec: null,
  width: 0,
  height: 0,
  isFavorite: false,
});

async function resolveAndCache(item: MediaItem): Promise<MediaPreview> {
  const hit = previewCache.get(item.id);
  if (hit) return hit;
  const preview = await media.resolvePreview(item);
  previewCache.set(item.id, preview);
  return preview;
}

/** Apply an optional media filter to a scoped list. */
export function applyFilter(items: MediaItem[], filter: MediaFilter | null | undefined, shortMax: number): MediaItem[] {
  switch (filter) {
    case 'photo':
      return onlyKind(items, 'photo');
    case 'video':
      return onlyKind(items, 'video');
    case 'short':
      return shortVideos(items, shortMax);
    case 'long':
      return longVideos(items, shortMax);
    default:
      return items;
  }
}

/** Scope the library index down to a collection's candidate items. */
async function candidatesFor(c: CollectionRef, filter: MediaFilter | null | undefined): Promise<MediaItem[]> {
  const { items } = useLibrary.getState();
  const shortMax = useSettings.getState().settings.shortVideoMaxSec;
  let base: MediaItem[];
  switch (c.kind) {
    case 'album':
      base = await media.queryAlbum(c.key);
      break;
    case 'photos':
      base = onlyKind(items, 'photo');
      break;
    case 'videos':
      base = onlyKind(items, 'video');
      break;
    case 'short-videos':
      base = shortVideos(items, shortMax);
      break;
    case 'long-videos':
      base = longVideos(items, shortMax);
      break;
    case 'month':
      base = items.filter((i) => monthMatches(i, c.key));
      break;
    case 'random':
    default:
      base = items;
  }
  return applyFilter(base, filter, shortMax);
}

function monthMatches(item: MediaItem, key: string): boolean {
  if (item.creationTime == null) return key === 'unknown';
  const d = new Date(item.creationTime);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === key;
}

export const useSession = create<SessionState>((set, get) => ({
  collection: null,
  filter: null,
  eligible: 0,
  state: null,
  items: {},
  preview: null,
  previewLoading: false,
  previewError: false,
  starting: false,
  generation: 0,

  start: async (collection, filter = null) => {
    const gen = ++startSeq;
    ++previewSeq; // any in-flight preview from a previous session is now stale
    previewCache.clear();
    set({ starting: true, generation: gen, collection, filter, state: null, items: {}, eligible: 0, preview: null, previewError: false, previewLoading: false });
    const { settings } = useSettings.getState();
    const { reviewedIds } = useLibrary.getState();
    const candidates = await candidatesFor(collection, filter);
    if (gen !== startSeq) return; // a newer session started meanwhile
    const eligibleOrder = buildSessionOrder(candidates, {
      includeFavorites: settings.includeFavorites,
      reviewedIds,
      shuffle: collection.kind === 'random',
      seed: hashSeed(collectionIdOf(collection) + (filter ?? '')),
    });
    // A session is a batch of up to SESSION_SIZE; the denominator is always real.
    const order = eligibleOrder.slice(0, SESSION_SIZE);
    const itemsById: Record<string, MediaItem> = {};
    for (const it of candidates) itemsById[it.id] = it;
    set({ state: createReview(order), items: itemsById, eligible: eligibleOrder.length, starting: false });
    await get().loadCurrentPreview();
  },

  loadCurrentPreview: async () => {
    const seq = ++previewSeq; // every entry invalidates older resolves
    const st = get().state;
    const id = st ? currentId(st) : undefined;
    if (!st || !id) {
      set({ preview: null, previewLoading: false, previewError: false });
      return;
    }
    const item = get().items[id] ?? fallbackItem(id);
    const cached = previewCache.get(id);
    if (cached) {
      set({ preview: cached, previewLoading: false, previewError: false });
      return;
    }
    set({ previewLoading: true, previewError: false, preview: null });
    try {
      const preview = await resolveAndCache(item);
      if (seq === previewSeq) set({ preview, previewLoading: false });
    } catch {
      if (seq === previewSeq) set({ previewError: true, previewLoading: false, preview: null });
    }
  },

  retryPreview: async () => {
    const st = get().state;
    const id = st ? currentId(st) : undefined;
    if (id) previewCache.delete(id);
    await get().loadCurrentPreview();
  },

  keep: () => applyDecision(get, set, 'keep'),
  remove: () => applyDecision(get, set, 'remove'),

  skip: () => {
    const st = get().state;
    if (!st) return;
    set({ state: skipCard(st) });
    void get().loadCurrentPreview();
  },

  undo: async () => {
    const st = get().state;
    if (!st) return;
    const last = st.history[st.history.length - 1];
    if (!last) return;
    set({ state: undoCard(st) });
    if (last.type !== 'skip') {
      await enqueueWrite(() => storage.deleteReviews([last.id]));
      useLibrary.getState().removeReviewed([last.id]);
    }
    await get().loadCurrentPreview();
  },

  reset: () => {
    ++startSeq;
    ++previewSeq;
    previewCache.clear();
    set({ collection: null, filter: null, eligible: 0, state: null, items: {}, preview: null, previewError: false, previewLoading: false, starting: false });
  },
}));

async function applyDecision(
  get: () => SessionState,
  set: (patch: Partial<SessionState>) => void,
  decision: Decision,
): Promise<void> {
  const gen = startSeq;
  const st = get().state;
  if (!st) return;
  const id = currentId(st);
  if (!id) return;
  const item = get().items[id];
  // Persist first; advance only once the decision is durable.
  await enqueueWrite(() => storage.putReview({ id, decision, decidedAt: Date.now(), modMarker: item?.modificationTime ?? null }));
  if (gen !== startSeq || get().state !== st) return; // session changed under us
  set({ state: decide(st, decision) });
  useLibrary.getState().addReviewed([id]);
  await get().loadCurrentPreview();
}
