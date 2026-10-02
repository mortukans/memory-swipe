import * as SQLite from 'expo-sqlite';
import {
  DEFAULT_SETTINGS,
  type ReviewRow,
  type SessionRow,
  type Settings,
  type Storage,
  type StoredDecision,
} from './types';

/**
 * Native (iOS / Android) Storage backed by expo-sqlite. SQLite is used rather
 * than key/value storage because a large library can accumulate tens of
 * thousands of per-asset decisions and we filter collections against them.
 */

const DB_NAME = 'memoryswipe.db';

interface ReviewDbRow {
  id: string;
  decision: string;
  decided_at: number;
  mod_marker: number | null;
}
interface SettingsDbRow {
  value: string;
}
interface SessionDbRow {
  id: string;
  collection_id: string;
  seed: number;
  cursor: number;
  status: string;
  created_at: number;
}

export function createStorage(): Storage {
  let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

  async function db(): Promise<SQLite.SQLiteDatabase> {
    if (!dbPromise) {
      dbPromise = (async () => {
        const d = await SQLite.openDatabaseAsync(DB_NAME);
        await d.execAsync(`
          PRAGMA journal_mode = WAL;
          CREATE TABLE IF NOT EXISTS asset_review (
            id TEXT PRIMARY KEY NOT NULL,
            decision TEXT NOT NULL,
            decided_at INTEGER NOT NULL,
            mod_marker INTEGER
          );
          CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY NOT NULL,
            value TEXT NOT NULL
          );
          CREATE TABLE IF NOT EXISTS session (
            collection_id TEXT PRIMARY KEY NOT NULL,
            id TEXT NOT NULL,
            seed INTEGER NOT NULL,
            cursor INTEGER NOT NULL,
            status TEXT NOT NULL,
            created_at INTEGER NOT NULL
          );
        `);
        return d;
      })();
    }
    return dbPromise;
  }

  return {
    async init() {
      await db();
    },

    async getReviews() {
      const d = await db();
      const rows = await d.getAllAsync<ReviewDbRow>('SELECT * FROM asset_review');
      return rows.map((r) => ({
        id: r.id,
        decision: r.decision as StoredDecision,
        decidedAt: r.decided_at,
        modMarker: r.mod_marker,
      }));
    },
    async getReviewedIds() {
      const d = await db();
      const rows = await d.getAllAsync<{ id: string }>('SELECT id FROM asset_review');
      return new Set(rows.map((r) => r.id));
    },
    async putReview(row) {
      await this.putReviews([row]);
    },
    async putReviews(rows) {
      if (rows.length === 0) return;
      const d = await db();
      await d.withTransactionAsync(async () => {
        for (const r of rows) {
          await d.runAsync(
            'INSERT OR REPLACE INTO asset_review (id, decision, decided_at, mod_marker) VALUES (?, ?, ?, ?)',
            r.id,
            r.decision,
            r.decidedAt,
            r.modMarker,
          );
        }
      });
    },
    async deleteReviews(ids) {
      if (ids.length === 0) return;
      const d = await db();
      const placeholders = ids.map(() => '?').join(',');
      await d.runAsync(`DELETE FROM asset_review WHERE id IN (${placeholders})`, ...ids);
    },
    async clearReviews() {
      const d = await db();
      await d.runAsync('DELETE FROM asset_review');
    },

    async getSettings() {
      const d = await db();
      const row = await d.getFirstAsync<SettingsDbRow>("SELECT value FROM settings WHERE key = 'app'");
      if (!row) return { ...DEFAULT_SETTINGS };
      try {
        return { ...DEFAULT_SETTINGS, ...(JSON.parse(row.value) as Partial<Settings>) };
      } catch {
        return { ...DEFAULT_SETTINGS };
      }
    },
    async saveSettings(patch) {
      const d = await db();
      const current = await this.getSettings();
      const next: Settings = { ...current, ...patch };
      await d.runAsync(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('app', ?)",
        JSON.stringify(next),
      );
    },

    async getSession(collectionId) {
      const d = await db();
      const row = await d.getFirstAsync<SessionDbRow>(
        'SELECT * FROM session WHERE collection_id = ?',
        collectionId,
      );
      if (!row) return null;
      return {
        id: row.id,
        collectionId: row.collection_id,
        seed: row.seed,
        cursor: row.cursor,
        status: row.status as SessionRow['status'],
        createdAt: row.created_at,
      };
    },
    async saveSession(row) {
      const d = await db();
      await d.runAsync(
        `INSERT OR REPLACE INTO session (collection_id, id, seed, cursor, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        row.collectionId,
        row.id,
        row.seed,
        row.cursor,
        row.status,
        row.createdAt,
      );
    },
  };
}
