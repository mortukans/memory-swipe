import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme';
import { T } from './Text';

type Tone = 'neutral' | 'keep' | 'remove';

/**
 * Round control. 44pt default (secondary), 60pt for session decisions.
 * neutral: soft tile fill + hairline · keep: lime, no border · remove: terracotta tint.
 * An optional visible label sits below and may wrap to two lines.
 */
export function RoundButton({
  icon,
  label,
  onPress,
  size = 44,
  tone = 'neutral',
  disabled,
  accessibilityLabel,
  accessibilityHint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  onPress: () => void;
  size?: 44 | 60;
  tone?: Tone;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}) {
  const t = useTheme();
  const bg = tone === 'keep' ? t.colors.accent : tone === 'remove' ? t.colors.removeTint : t.colors.tile;
  const fg = tone === 'keep' ? t.colors.ink : tone === 'remove' ? t.colors.removeIcon : t.colors.text;
  return (
    <View style={{ alignItems: 'center', gap: 8, maxWidth: 96 }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: !!disabled }}
        hitSlop={6}
        style={({ pressed }) => ({
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed && tone === 'neutral' ? t.colors.line : bg,
          borderWidth: tone === 'neutral' ? 1 : 0,
          borderColor: t.colors.line,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        })}
      >
        <Ionicons name={icon} size={size === 60 ? 24 : 20} color={fg} />
      </Pressable>
      {label ? (
        <T variant="meta" tone="secondary" style={{ fontSize: 11, lineHeight: 14, textAlign: 'center' }}>
          {label}
        </T>
      ) : null}
    </View>
  );
}
