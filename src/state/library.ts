import { create } from 'zustand';
import type { MediaAccess, MediaItem } from '../media/types';
import { ensureStorageReady, media, storage } from './instances';

/**
 * Library index: one cheap metadata pass over the whole library plus the set of
 * already-reviewed ids. Collection screens derive everything (months, counts,
 * filters) from `items` without touching native again until a refresh.
 */
interface LibraryState {
  access: MediaAccess;
  items: MediaItem[];
  reviewedIds: Set<string>;
  loading: boolean;
  error: string | null;
  loadedAt: number | null;

  checkAccess: () => Promise<MediaAccess>;
  requestAccess: () => Promise<MediaAccess>;
  presentLimitedPicker: () => Promise<void>;
  refresh: () => Promise<void>;

  /** Keep counts in sync as the user reviews, without a full refresh. */
  addReviewed: (ids: string[]) => void;
  removeReviewed: (ids: string[]) => void;
  /** Drop deleted assets from the in-memory index. */
  forget: (ids: string[]) => void;
}

export const useLibrary = create<LibraryState>((set, get) => ({
  access: 'undetermined',
  items: [],
  reviewedIds: new Set(),
  loading: false,
  error: null,
  loadedAt: null,

  checkAccess: async () => {
    const access = await media.getAccess();
    set({ access });
    return access;
  },
  requestAccess: async () => {
    const access = await media.requestAccess();
    set({ access });
    if (access === 'all' || access === 'limited') await get().refresh();
    return access;
  },
  presentLimitedPicker: async () => {
    await media.presentLimitedPicker();
    await get().refresh();
  },

  refresh: async () => {
    const access = get().access === 'undetermined' ? await get().checkAccess() : get().access;
    if (access !== 'all' && access !== 'limited') {
      set({ items: [], loading: false });
      return;
    }
    set({ loading: true, error: null });
    try {
      await ensureStorageReady();
      const [items, reviewedIds] = await Promise.all([media.query(), storage.getReviewedIds()]);
      set({ items, reviewedIds, loading: false, loadedAt: Date.now() });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : 'load_failed' });
    }
  },

  addReviewed: (ids) => {
    const next = new Set(get().reviewedIds);
    for (const id of ids) next.add(id);
    set({ reviewedIds: next });
  },
  removeReviewed: (ids) => {
    const next = new Set(get().reviewedIds);
    for (const id of ids) next.delete(id);
    set({ reviewedIds: next });
  },
  forget: (ids) => {
    const gone = new Set(ids);
    set({ items: get().items.filter((i) => !gone.has(i.id)) });
    get().removeReviewed(ids);
  },
}));
