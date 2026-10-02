import { useEffect, useState } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';
import { useSettings } from '../state/settings';

/**
 * "Room for more" design tokens (docs/design-handoff/tokens.json).
 * Warm paper, ink typography, one crisp lime accent, a terracotta mark.
 * Text on lime is always ink — never white. Every text/background pair below
 * was checked against WCAG AA (4.5:1 text, 3:1 non-text).
 */
export interface Palette {
  bg: string;
  text: string;
  secondary: string;
  surface: string;
  accent: string;
  /** Terracotta fill — only for the real destructive step. */
  destructive: string;
  /** Terracotta as *text* (darker/lighter than the fill so it passes AA). */
  destructiveText: string;
  line: string;
  tile: string;
  removeTint: string;
  /** Icon colour on removeTint (3:1 non-text). */
  removeIcon: string;
  imageBg: string;
  ribbonTrack: string;
  ribbonKeep: string;
  ribbonRemove: string;
  /** The nav capsule fill (ink in light, paper-white in dark). */
  capsule: string;
  navInactive: string;
  toggleOff: string;
  toggleOffBorder: string;
  orbit: string;
  /** Always-dark ink, for text on lime. */
  ink: string;
  /** Solid badge/pill background over photos. */
  badge: string;
}

const light: Palette = {
  bg: '#F5F2E9',
  text: '#242A25',
  secondary: '#5F675E',
  surface: '#FFFEF8',
  accent: '#D8ED91',
  destructive: '#C04E31',
  destructiveText: '#B04628',
  line: '#DCDED2',
  tile: '#EBECE2',
  removeTint: '#F1DFD5',
  removeIcon: '#C04E31',
  imageBg: '#E4E9DC',
  ribbonTrack: '#E1E3D7',
  ribbonKeep: '#A4B970',
  ribbonRemove: '#C0583A',
  capsule: '#242A25',
  navInactive: '#C4C9BE',
  toggleOff: '#C7CEBC',
  toggleOffBorder: '#8F978A',
  orbit: '#A5B77C',
  ink: '#242A25',
  badge: 'rgba(36,42,37,0.86)',
};

const dark: Palette = {
  bg: '#202720',
  text: '#F3F1E7',
  secondary: '#B6BEAC',
  surface: '#36402F',
  accent: '#D8ED91',
  destructive: '#C04E31',
  destructiveText: '#E8785A',
  line: '#495142',
  tile: '#343D30',
  removeTint: '#4A3A34',
  removeIcon: '#E8785A',
  imageBg: '#2C342A',
  ribbonTrack: '#3A4236',
  ribbonKeep: '#A4B970',
  ribbonRemove: '#D58C71',
  capsule: '#F3F1E7',
  navInactive: '#697068',
  toggleOff: '#4A5244',
  toggleOffBorder: '#6A7265',
  orbit: '#A5B77C',
  ink: '#242A25',
  badge: 'rgba(36,42,37,0.86)',
};

/** Base 4pt scale. `page` is the 20pt page inset. */
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, page: 20, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { xs: 4, sm: 8, print: 11, callout: 18, tile: 20, button: 22, nav: 28, pill: 30 } as const;

/** Motion contract (ms / pt / degrees). */
export const motion = {
  commitMs: 240,
  snapbackMs: 300,
  snapbackDamping: 0.8,
  driftMs: 7000,
  reduceMs: 120,
  ribbonMs: 180,
  orbitMs: 450,
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

let systemReduceMotion = false;
const reduceListeners = new Set<(v: boolean) => void>();
let reduceSubscribed = false;

function subscribeSystemReduceMotion() {
  if (reduceSubscribed) return;
  reduceSubscribed = true;
  try {
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      systemReduceMotion = Boolean(v);
      reduceListeners.forEach((l) => l(systemReduceMotion));
    });
    AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => {
      systemReduceMotion = Boolean(v);
      reduceListeners.forEach((l) => l(systemReduceMotion));
    });
  } catch {
    /* platform without the API (web) */
  }
}

/** True when motion should be reduced: the app preference OR the live system setting. */
export function useMotion(): { reduce: boolean } {
  const pref = useSettings((s) => s.settings.reduceMotion);
  const [sys, setSys] = useState(systemReduceMotion);
  useEffect(() => {
    subscribeSystemReduceMotion();
    reduceListeners.add(setSys);
    setSys(systemReduceMotion);
    return () => {
      reduceListeners.delete(setSys);
    };
  }, []);
  return { reduce: Boolean(pref) || sys };
}
