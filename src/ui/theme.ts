import { useColorScheme } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSettings } from '../state/settings';

/**
 * "Room for more" design tokens (docs/design-handoff/tokens.json).
 * Warm paper, ink typography, one crisp lime accent, a terracotta mark.
 * Text on lime is always ink — never white.
 */
export interface Palette {
  /** Page background (paper). */
  bg: string;
  /** Primary text (ink). */
  text: string;
  /** Secondary text. */
  secondary: string;
  /** Print / card surface. */
  surface: string;
  /** Lime accent. */
  accent: string;
  /** Terracotta destructive. Never a decorative primary. */
  destructive: string;
  line: string;
  /** Soft filled surfaces: tiles, callouts, round controls. */
  tile: string;
  /** Tint behind the Remove control / stamp. */
  removeTint: string;
  /** Neutral background behind a fitted photo. */
  imageBg: string;
  ribbonTrack: string;
  ribbonKeep: string;
  ribbonRemove: string;
  navInactive: string;
  toggleOff: string;
  orbit: string;
  /** Always-dark ink, for text that sits on lime or on the nav capsule. */
  ink: string;
  scrim: string;
  overlay: string;
}

const light: Palette = {
  bg: '#F5F2E9',
  text: '#242A25',
  secondary: '#697068',
  surface: '#FFFEF8',
  accent: '#D8ED91',
  destructive: '#C04E31',
  line: '#DCDED2',
  tile: '#EBECE2',
  removeTint: '#F1DFD5',
  imageBg: '#E4E9DC',
  ribbonTrack: '#E1E3D7',
  ribbonKeep: '#A4B970',
  ribbonRemove: '#D58C71',
  navInactive: '#C4C9BE',
  toggleOff: '#C7CEBC',
  orbit: '#A5B77C',
  ink: '#242A25',
  scrim: 'rgba(36,42,37,0.33)',
  overlay: 'rgba(36,42,37,0.8)',
};

const dark: Palette = {
  bg: '#202720',
  text: '#F3F1E7',
  secondary: '#B6BEAC',
  surface: '#36402F',
  accent: '#D8ED91',
  destructive: '#C04E31',
  line: '#495142',
  tile: '#343D30',
  removeTint: '#4A3A34',
  imageBg: '#2C342A',
  ribbonTrack: '#3A4236',
  ribbonKeep: '#A4B970',
  ribbonRemove: '#D58C71',
  navInactive: '#C4C9BE',
  toggleOff: '#4A5244',
  orbit: '#A5B77C',
  ink: '#242A25',
  scrim: 'rgba(0,0,0,0.5)',
  overlay: 'rgba(0,0,0,0.75)',
};

/** Base 4pt scale. `page` is the 20pt page inset. */
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, page: 20, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { xs: 4, sm: 8, print: 11, callout: 18, tile: 20, button: 22, nav: 28, pill: 30 } as const;

/** Motion contract (ms / pt / degrees). */
export const motion = {
  commitMs: 240,
  snapbackMs: 300,
  driftMs: 7000,
  reduceMs: 120,
  ribbonMs: 180,
  translationThreshold: 85,
  projectedThreshold: 120,
  maxRotationDeg: 12,
  restRotationDeg: -2,
} as const;

/** Touch targets. */
export const targets = { min: 44, decision: 60, cta: 56 } as const;

export interface Theme {
  dark: boolean;
  colors: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  motion: typeof motion;
  targets: typeof targets;
}

/** Resolve the active theme from the user's setting + the OS colour scheme. */
export function useTheme(): Theme {
  const system = useColorScheme();
  const setting = useSettings((s) => s.settings.theme);
  const isDark = setting === 'system' ? system === 'dark' : setting === 'dark';
  return { dark: isDark, colors: isDark ? dark : light, spacing, radius, motion, targets };
}

/** True when motion should be reduced: the app preference OR the system setting. */
export function useMotion(): { reduce: boolean } {
  const systemReduce = useReducedMotion();
  const pref = useSettings((s) => s.settings.reduceMotion);
  return { reduce: Boolean(pref) || Boolean(systemReduce) };
}
