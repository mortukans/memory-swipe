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
    await ensureStorageReady();
    const settings = await storage.getSettings();
    set({ settings, ready: true });
  },
  update: async (patch) => {
    set({ settings: { ...get().settings, ...patch } });
    await storage.saveSettings(patch);
  },
}));
