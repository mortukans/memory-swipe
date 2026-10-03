import { create } from 'zustand';
import type { MediaPreview } from '../media/types';
import { ensureStorageReady, media, storage } from './instances';
import { useLibrary } from './library';
import { useSession } from './session';

/**
 * The deletion review queue: everything the user has marked for deletion, read
 * from durable storage (so it spans sessions and survives restarts). This is the
 * only place that actually deletes, and it follows the handoff's rules:
 *   1. revalidate every queued id still exists right before deleting,
 *   2. hand the survivors to the system delete (iOS shows its own confirmation),
 *   3. ALWAYS reconcile what truly went by re-checking existence afterwards —
 *      on success as well as on rejection — and only clear confirmed ids,
 *   4. report honestly: deleted / still waiting / no longer available; never
 *      count an item that vanished outside the app as "deleted" by us.
 */
export interface DeleteResult {
  requested: number;
  /** Confirmed removed by the system call. */
  deleted: number;
  /** Still queued (user cancelled or the system left them). */
  remaining: number;
  /** Were no longer in the library before we asked (deleted elsewhere / deselected). Cleared from the queue, not counted as deleted. */
  unavailable: number;
  /** The user cancelled the system dialog (nothing in `present` was removed). */
  cancelled: boolean;
  /** The system call threw something other than a cancel and nothing changed. */
  failed: boolean;
}

interface QueueState {
  ids: string[];
  /** Only populated on the web mock (where ids are not renderable URIs). */
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
    try {
      await ensureStorageReady();
      const reviews = await storage.getReviews();
      const ids = reviews.filter((r) => r.decision === 'remove').map((r) => r.id);
      set({ ids, loading: false });
      if (media.isMock) {
        // Web dev only: ids are not URIs there, so resolve display URLs.
        const previews: Record<string, MediaPreview | undefined> = {};
        await Promise.all(
          ids.map(async (id) => {
            try {
              const item = useLibrary.getState().items.find((i) => i.id === id);
              previews[id] = await media.resolvePreview(
                item ?? { id, kind: 'photo', creationTime: null, modificationTime: null, durationSec: null, width: 0, height: 0, isFavorite: false },
              );
            } catch {
              previews[id] = undefined;
            }
          }),
        );
        set({ previews });
      }
    } catch {
      set({ loading: false });
    }
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
    const ids = get().ids;
    set({ deleting: true });
    let result: DeleteResult = { requested: ids.length, deleted: 0, remaining: ids.length, unavailable: 0, cancelled: false, failed: false };
    try {
      // 0. Without Photos access every existence check fails; that must never read as "unavailable".
      const access = await media.getAccess();
      useLibrary.setState({ access });
      if (access !== 'all' && access !== 'limited') throw new Error('no_access');
      // 1. Revalidate existence just before deleting.
      const live = await media.existing(ids);
      const present = ids.filter((id) => live.has(id));
      const unavailable = ids.filter((id) => !live.has(id));

      const deleted = new Set<string>();
      let cancelled = false;
      let failed = false;

      // 2 + 3. Delete the survivors (iOS confirms), then reconcile — always.
      if (present.length > 0) {
        try {
          await media.deleteAssets(present);
        } catch {
          cancelled = true; // user cancelled or the call failed; reconciliation below tells the truth
        }
        const stillThere = await media.existing(present);
        for (const id of present) if (!stillThere.has(id)) deleted.add(id);
        if (cancelled && deleted.size > 0) cancelled = false; // partial success is not a cancel
        if (!cancelled && deleted.size === 0 && present.length > 0) failed = true;
      }

      // 4. Durable cleanup: drop what truly went and what no longer exists; keep the rest queued.
      const clear = [...deleted, ...unavailable];
      await storage.deleteReviews(clear);
      useLibrary.getState().forget(clear);
      const remaining = ids.filter((id) => !deleted.has(id) && live.has(id));

      result = { requested: ids.length, deleted: deleted.size, remaining: remaining.length, unavailable: unavailable.length, cancelled, failed };
      set({ ids: remaining });
      // An active swipe session may still reference these ids.
      if (clear.length > 0) useSession.getState().reset();
    } catch {
      result = { ...result, failed: true };
    } finally {
      set({ deleting: false, lastResult: result });
    }
    return result;
  },
}));
