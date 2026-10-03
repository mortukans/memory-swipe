import { create } from 'zustand';
import { DEFAULT_SETTINGS, type Settings } from '../storage';
import { ensureStorageReady, storage } from './instances';

interface SettingsState {
  settings: Settings;
  ready: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<Settings>) => Promise<void>;
}

export const useSettings = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  ready: false,
  load: async () => {
    try {
      await ensureStorageReady();
      const settings = await storage.getSettings();
      set({ settings, ready: true });
    } catch {
      set({ ready: true }); // defaults; never a blank app
    }
  },
  update: async (patch) => {
    const next = { ...get().settings, ...patch };
    set({ settings: next });
    try {
      await storage.saveSettings(next);
    } catch {
      /* in-memory state already reflects the choice */
    }
  },
}));
