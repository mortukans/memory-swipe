import { useColorScheme } from 'react-native';
import { useSettings } from '../state/settings';

/**
 * Design tokens. Calm and restrained: near-neutral surfaces, generous spacing,
 * a single soft accent, and clear but gentle keep/remove colours (never relying
 * on colour alone — every action also has a label and an icon).
 */
export interface Palette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textDim: string;
  textFaint: string;
  border: string;
  accent: string;
  accentText: string;
  keep: string;
  remove: string;
  skip: string;
  danger: string;
  overlay: string;
  scrim: string;
}

const dark: Palette = {
  bg: '#0E0F13',
  surface: '#191B22',
  surfaceAlt: '#23262F',
  text: '#F3F4F7',
  textDim: '#AEB2BD',
  textFaint: '#71757F',
  border: '#2C2F39',
  accent: '#7C8CF8',
  accentText: '#0E0F13',
  keep: '#49C17E',
  remove: '#F07A72',
  skip: '#9AA0AC',
  danger: '#F0564B',
  overlay: 'rgba(0,0,0,0.5)',
  scrim: 'rgba(0,0,0,0.35)',
};

const light: Palette = {
  bg: '#F6F7F9',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF0F4',
  text: '#15171C',
  textDim: '#5A5F6B',
  textFaint: '#9298A3',
  border: '#E1E4EA',
  accent: '#4E5FE0',
  accentText: '#FFFFFF',
  keep: '#1F9D57',
  remove: '#D8483E',
  skip: '#70747E',
  danger: '#C8372D',
  overlay: 'rgba(0,0,0,0.45)',
  scrim: 'rgba(0,0,0,0.25)',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;
export const font = {
  display: 34,
  title: 24,
  heading: 19,
  body: 16,
  label: 14,
  caption: 12,
} as const;

export interface Theme {
  dark: boolean;
  colors: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  font: typeof font;
}

/** Resolve the active theme from the user's setting + the OS colour scheme. */
export function useTheme(): Theme {
  const system = useColorScheme();
  const setting = useSettings((s) => s.settings.theme);
  const isDark = setting === 'system' ? system !== 'light' : setting === 'dark';
  return { dark: isDark, colors: isDark ? dark : light, spacing, radius, font };
}
