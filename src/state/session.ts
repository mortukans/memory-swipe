import { Image } from 'expo-image';
import { create } from 'zustand';
import {
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

/**
 * The active swipe session. Holds the pure ReviewState plus the currently
 * resolved preview, and mirrors every keep/remove to durable storage the moment
 * it happens so progress survives a restart. Skips are session-only and never
 * persisted. Nothing here deletes anything — see src/state/queue.ts.
 */
interface SessionState {
  collection: CollectionRef | null;
  state: ReviewState | null;
  /** id -> item for everything in this session (kind, duration, dimensions). */
  items: Record<string, MediaItem>;
  preview: MediaPreview | null;
  previewLoading: boolean;
  previewError: boolean;
  starting: boolean;

  start: (collection: CollectionRef) => Promise<void>;
  loadCurrentPreview: () => Promise<void>;
  keep: () => Promise<void>;
  remove: () => Promise<void>;
  skip: () => void;
  undo: () => Promise<void>;
  reset: () => void;
}

let previewSeq = 0;

/** Resolved previews cached for the current session, so a prefetched card is instant. */
const previewCache = new Map<string, MediaPreview>();

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

/** Warm the next couple of cards so forward swipes don't wait on a round-trip. */
function prefetchAhead(order: string[], index: number, items: Record<string, MediaItem>): void {
  for (let k = 1; k <= 2; k++) {
    const id = order[index + k];
    if (!id || previewCache.has(id) || !items[id]) continue;
    void resolveAndCache(items[id])
      .then((p) => {
        if (p.kind === 'photo') void Image.prefetch(p.uri).catch(() => {});
      })
      .catch(() => {});
  }
}

/** Scope the library index down to a collection's candidate items. */
async function candidatesFor(c: CollectionRef): Promise<MediaItem[]> {
  const { items } = useLibrary.getState();
  const shortMax = useSettings.getState().settings.shortVideoMaxSec;
  switch (c.kind) {
    case 'album':
      return media.queryAlbum(c.key);
    case 'photos':
      return onlyKind(items, 'photo');
    case 'videos':
      return onlyKind(items, 'video');
    case 'short-videos':
      return shortVideos(items, shortMax);
    case 'long-videos':
      return longVideos(items, shortMax);
    case 'month':
      return items.filter((i) => monthMatches(i, c.key));
    case 'random':
    default:
      return items;
  }
}

function monthMatches(item: MediaItem, key: string): boolean {
  if (item.creationTime == null) return key === 'unknown';
  const d = new Date(item.creationTime);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === key;
}

export const useSession = create<SessionState>((set, get) => ({
  collection: null,
  state: null,
  items: {},
  preview: null,
  previewLoading: false,
  previewError: false,
  starting: false,

  start: async (collection) => {
    previewCache.clear();
    set({ starting: true, collection, state: null, preview: null, previewError: false });
    const { settings } = useSettings.getState();
    const { reviewedIds } = useLibrary.getState();
    const candidates = await candidatesFor(collection);
    const order = buildSessionOrder(candidates, {
      includeFavorites: settings.includeFavorites,
      reviewedIds,
      shuffle: collection.kind === 'random',
      seed: hashSeed(collectionIdOf(collection)),
    });
    const itemsById: Record<string, MediaItem> = {};
    for (const it of candidates) itemsById[it.id] = it;
    set({ state: createReview(order), items: itemsById, starting: false });
    await get().loadCurrentPreview();
  },

  loadCurrentPreview: async () => {
    const st = get().state;
    const id = st ? currentId(st) : undefined;
    if (!st || !id) {
      set({ preview: null, previewLoading: false, previewError: false });
      return;
    }
    const items = get().items;
    const item = items[id] ?? fallbackItem(id);

    // Cache hit (prefetched): show instantly, no spinner.
    const cached = previewCache.get(id);
    if (cached) {
      set({ preview: cached, previewLoading: false, previewError: false });
      prefetchAhead(st.order, st.index, items);
      return;
    }

    const seq = ++previewSeq;
    set({ previewLoading: true, previewError: false, preview: null });
    try {
      const preview = await resolveAndCache(item);
      if (seq === previewSeq) {
        set({ preview, previewLoading: false });
        prefetchAhead(st.order, st.index, items);
      }
    } catch {
      if (seq === previewSeq) set({ previewError: true, previewLoading: false, preview: null });
    }
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
      await storage.deleteReviews([last.id]);
      useLibrary.getState().removeReviewed([last.id]);
    }
    await get().loadCurrentPreview();
  },

  reset: () => set({ collection: null, state: null, items: {}, preview: null, previewError: false, previewLoading: false }),
}));

async function applyDecision(
  get: () => SessionState,
  set: (patch: Partial<SessionState>) => void,
  decision: Decision,
): Promise<void> {
  const st = get().state;
  if (!st) return;
  const id = currentId(st);
  if (!id) return;
  const item = get().items[id];
  set({ state: decide(st, decision) });
  await storage.putReview({ id, decision, decidedAt: Date.now(), modMarker: item?.modificationTime ?? null });
  useLibrary.getState().addReviewed([id]);
  await get().loadCurrentPreview();
}
