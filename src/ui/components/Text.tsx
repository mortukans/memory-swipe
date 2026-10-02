import { Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { font as fontTokens, useTheme } from '../theme';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption';
type Tone = 'default' | 'dim' | 'faint' | 'accent' | 'keep' | 'remove' | 'danger' | 'inverse';

const WEIGHT: Record<Variant, TextStyle['fontWeight']> = {
  display: '800',
  title: '700',
  heading: '700',
  body: '400',
  label: '600',
  caption: '500',
};

/** Themed text honouring Dynamic Type (allowFontScaling stays on by default). */
export function T({
  variant = 'body',
  tone = 'default',
  style,
  weight,
  ...rest
}: TextProps & { variant?: Variant; tone?: Tone; weight?: TextStyle['fontWeight'] }) {
  const t = useTheme();
  const color =
    tone === 'dim'
      ? t.colors.textDim
      : tone === 'faint'
        ? t.colors.textFaint
        : tone === 'accent'
          ? t.colors.accent
          : tone === 'keep'
            ? t.colors.keep
            : tone === 'remove'
              ? t.colors.remove
              : tone === 'danger'
                ? t.colors.danger
                : tone === 'inverse'
                  ? t.colors.accentText
                  : t.colors.text;
  return (
    <RNText
      {...rest}
      style={[{ color, fontSize: fontTokens[variant], fontWeight: weight ?? WEIGHT[variant], lineHeight: fontTokens[variant] * 1.3 }, style]}
    />
  );
}
