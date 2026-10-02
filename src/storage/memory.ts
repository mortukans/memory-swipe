import { DEFAULT_SETTINGS, type ReviewRow, type SessionRow, type Settings, type Storage } from './types';

/**
 * In-memory Storage used on web (dev previews) and in unit tests. It implements
 * the full contract so the app and tests can exercise the real orchestration
 * without a native database. Data does not survive a reload — that is fine for
 * dev; real persistence is the SQLite implementation on device.
 */
export function createMemoryStorage(seed?: {
  reviews?: ReviewRow[];
  settings?: Partial<Settings>;
}): Storage {
  const reviews = new Map<string, ReviewRow>();
  for (const r of seed?.reviews ?? []) reviews.set(r.id, r);
  let settings: Settings = { ...DEFAULT_SETTINGS, ...seed?.settings };
  const sessions = new Map<string, SessionRow>();

  return {
    async init() {},

    async getReviews() {
      return [...reviews.values()];
    },
    async getReviewedIds() {
      return new Set(reviews.keys());
    },
    async putReview(row) {
      reviews.set(row.id, row);
    },
    async putReviews(rows) {
      for (const r of rows) reviews.set(r.id, r);
    },
    async deleteReviews(ids) {
      for (const id of ids) reviews.delete(id);
    },
    async clearReviews() {
      reviews.clear();
    },

    async getSettings() {
      return { ...settings };
    },
    async saveSettings(patch) {
      settings = { ...settings, ...patch };
    },

    async getSession(collectionId) {
      return sessions.get(collectionId) ?? null;
    },
    async saveSession(row) {
      sessions.set(row.collectionId, row);
    },
  };
}
