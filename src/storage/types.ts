/**
 * Durable local storage contract. Two implementations (Metro picks by platform):
 *   - createStorage.ts     → expo-sqlite (iOS / Android)
 *   - createStorage.web.ts → in-memory (web dev + unit tests)
 *
 * Only review decisions, lightweight session cursors and settings live here.
 * Never photo content, filenames, album names or EXIF — none of that is stored
 * or ever leaves the device.
 */
export type StoredDecision = 'keep' | 'remove';

export interface ReviewRow {
  /** Device-local asset id. */
  id: string;
  decision: StoredDecision;
  decidedAt: number;
  /** Asset modificationTime when decided, so we can spot an asset that changed under us. */
  modMarker: number | null;
}

export type LanguageSetting = 'system' | 'en' | 'lv';
export type ThemeSetting = 'system' | 'light' | 'dark';

export interface Settings {
  language: LanguageSetting;
  theme: ThemeSetting;
  haptics: boolean;
  /** Include Favorites in sessions. Off by default — favorites are protected. */
  includeFavorites: boolean;
  /** Videos of at most this many seconds count as "short"; longer ones are "long". */
  shortVideoMaxSec: number;
  /** App-level Reduce Motion preference (combined with the system setting). */
  reduceMotion: boolean;
  /** The welcome + permission flow has been completed at least once. */
  onboarded: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  language: 'system',
  theme: 'system',
  haptics: true,
  includeFavorites: false,
  shortVideoMaxSec: 30,
  reduceMotion: false,
  onboarded: false,
};

export interface SessionRow {
  id: string;
  collectionId: string;
  seed: number;
  cursor: number;
  status: 'active' | 'done';
  createdAt: number;
}

export interface Storage {
  init(): Promise<void>;

  /** Every asset that already carries a keep/remove decision. */
  getReviews(): Promise<ReviewRow[]>;
  /** Convenience: just the set of decided ids, for filtering collections. */
  getReviewedIds(): Promise<Set<string>>;
  putReview(row: ReviewRow): Promise<void>;
  putReviews(rows: ReviewRow[]): Promise<void>;
  /** Drop decisions (e.g. after the assets were deleted, or stale ids on reconcile). */
  deleteReviews(ids: string[]): Promise<void>;
  /** Reset progress: clears all decisions. Never touches any media. */
  clearReviews(): Promise<void>;

  getSettings(): Promise<Settings>;
  saveSettings(patch: Partial<Settings>): Promise<void>;

  getSession(collectionId: string): Promise<SessionRow | null>;
  saveSession(row: SessionRow): Promise<void>;
}
