import { createMemoryStorage } from './memory';
import type { Storage } from './types';

// Web dev builds have no SQLite; use the in-memory implementation.
export function createStorage(): Storage {
  return createMemoryStorage();
}
