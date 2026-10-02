import { create } from 'zustand';
import type { MediaPreview } from '../media/types';
import { ensureStorageReady, media, storage } from './instances';
import { useLibrary } from './library';

/**
 * The deletion review queue: everything the user has marked for deletion, read
 * from durable storage (so it spans sessions and survives restarts). This is the
 * only place that actually deletes, and it follows the plan's safety rules:
 *   1. revalidate every queued id still exists right before deleting,
 *   2. hand the survivors to the system delete (iOS shows its own confirmation),
 *   3. reconcile what truly went by re-checking existence,
 *   4. keep anything cancelled / failed / already-gone-handling honest so the
 *      result screen never reports a false success.
 */
export interface DeleteResult {
  requested: number;
  deleted: number;
  remaining: number;
  /** The user cancelled or some deletions failed, leaving items still queued. */
  cancelled: boolean;
}

interface QueueState {
  ids: string[];
  previews: Record<string, MediaPreview | undefined>;
  loading: boolean;
  deleting: boolean;
  lastResult: DeleteResult | null;

  load: () => Promise<void>;
  pull: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  confirmDelete: () => Promise<DeleteResult>;
}

export const useQueue = create<QueueState>((set, get) => ({
  ids: [],
  previews: {},
  loading: false,
  deleting: false,
  lastResult: null,

  load: async () => {
    set({ loading: true });
    await ensureStorageReady();
    const reviews = await storage.getReviews();
    const ids = reviews.filter((r) => r.decision === 'remove').map((r) => r.id);
    set({ ids, loading: false });
    // Resolve thumbnails in the background; failures just leave a placeholder.
    const previews: Record<string, MediaPreview | undefined> = {};
    await Promise.all(
      ids.map(async (id) => {
        try {
          previews[id] = await media.resolvePreview({
            id,
            kind: 'photo',
            creationTime: null,
            modificationTime: null,
            durationSec: null,
            width: 0,
            height: 0,
            isFavorite: false,
          });
        } catch {
          previews[id] = undefined;
        }
      }),
    );
    set({ previews });
  },

  pull: async (id) => {
    // Remove from the deletion queue by turning it into a kept (still reviewed) item.
    await storage.putReview({ id, decision: 'keep', decidedAt: Date.now(), modMarker: null });
    set({ ids: get().ids.filter((x) => x !== id) });
  },

  clearAll: async () => {
    const ids = get().ids;
    await storage.putReviews(ids.map((id) => ({ id, decision: 'keep' as const, decidedAt: Date.now(), modMarker: null })));
    set({ ids: [] });
  },

  confirmDelete: async () => {
    set({ deleting: true });
    const ids = get().ids;

    // 1. Revalidate existence just before deleting.
    const live = await media.existing(ids);
    const present = ids.filter((id) => live.has(id));
    const missing = ids.filter((id) => !live.has(id)); // already gone outside the app

    const deleted = new Set<string>(missing);
    let cancelled = false;

    // 2 + 3. Delete the survivors; iOS confirms. Reconcile on any rejection.
    if (present.length > 0) {
      try {
        await media.deleteAssets(present);
        for (const id of present) deleted.add(id);
      } catch {
        const stillThere = await media.existing(present);
        for (const id of present) if (!stillThere.has(id)) deleted.add(id);
        cancelled = present.some((id) => stillThere.has(id));
      }
    }

    // 4. Durable cleanup: drop what truly went; keep the rest queued.
    const deletedIds = [...deleted];
    await storage.deleteReviews(deletedIds);
    useLibrary.getState().forget(deletedIds);
    const remaining = ids.filter((id) => !deleted.has(id));

    const result: DeleteResult = {
      requested: ids.length,
      deleted: deletedIds.length,
      remaining: remaining.length,
      cancelled,
    };
    const previews = { ...get().previews };
    for (const id of deletedIds) delete previews[id];
    set({ ids: remaining, previews, deleting: false, lastResult: result });
    return result;
  },
}));
