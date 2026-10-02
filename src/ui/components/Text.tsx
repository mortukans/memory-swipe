import { Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '../theme';

/**
 * Ink typography on paper. SF Pro via the system font; sizes from tokens.json.
 * hero 52/54 −2 · title 34/38 · heading 18 · body 16 · label 16 semibold ·
 * meta 12 · eyebrow 11 semibold uppercase. Dynamic Type stays on.
 */
export type TextVariant = 'hero' | 'title' | 'heading' | 'body' | 'label' | 'meta' | 'eyebrow';
export type TextTone = 'default' | 'secondary' | 'destructive' | 'inverse' | 'ink' | 'accent';

const STYLES: Record<TextVariant, TextStyle> = {
  hero: { fontSize: 52, lineHeight: 54, letterSpacing: -2, fontWeight: '400' },
  title: { fontSize: 34, lineHeight: 38, letterSpacing: -1.3, fontWeight: '400' },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  label: { fontSize: 16, lineHeight: 20, fontWeight: '600' },
  meta: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  eyebrow: { fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 1.7, textTransform: 'uppercase' },
};

export function T({
  variant = 'body',
  tone = 'default',
  style,
  ...rest
}: TextProps & { variant?: TextVariant; tone?: TextTone }) {
  const t = useTheme();
  const color =
    tone === 'secondary'
      ? t.colors.secondary
      : tone === 'destructive'
        ? t.colors.destructive
        : tone === 'inverse'
          ? t.colors.bg
          : tone === 'ink'
            ? t.colors.ink
            : tone === 'accent'
              ? t.colors.accent
              : t.colors.text;
  return <RNText {...rest} style={[STYLES[variant], { color }, style]} />;
}
