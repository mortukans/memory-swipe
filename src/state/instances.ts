import adapter from '../media/adapter';
import { createStorage } from '../storage';
import type { Storage } from '../storage';

/** Process-wide singletons. The adapter is platform-resolved; storage too. */
export const media = adapter;
export const storage: Storage = createStorage();

let initPromise: Promise<void> | null = null;
/** Initialise durable storage exactly once. */
export function ensureStorageReady(): Promise<void> {
  if (!initPromise) initPromise = storage.init();
  return initPromise;
}
