import { Ionicons } from '@expo/vector-icons';
import { forwardRef } from 'react';
import { ActivityIndicator, Pressable, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { T } from './Text';

type Variant = 'ink' | 'lime' | 'danger' | 'ghost';

/**
 * The 56pt primary CTA: label left, ↗ arrow right, 22pt radius.
 * ink (default) · lime (text is ink, never white) · danger (terracotta, only for
 * the real destructive step) · ghost (text-only secondary). Pressed = a gentle
 * scale instead of a flash.
 */
export const PrimaryButton = forwardRef<
  View,
  {
    label: string;
    onPress: () => void;
    variant?: Variant;
    arrow?: boolean;
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    style?: ViewStyle;
    accessibilityHint?: string;
  }
>(function PrimaryButton({ label, onPress, variant = 'ink', arrow = true, disabled, loading, fullWidth = true, style, accessibilityHint }, ref) {
  const t = useTheme();
  const bg =
    variant === 'ink' ? t.colors.text : variant === 'lime' ? t.colors.accent : variant === 'danger' ? t.colors.destructive : 'transparent';
  const fg = variant === 'ink' ? t.colors.bg : variant === 'lime' ? t.colors.ink : variant === 'danger' ? '#FFFFFF' : t.colors.text;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      ref={ref}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      style={({ pressed }) => [
        {
          minHeight: t.targets.cta,
          backgroundColor: bg,
          borderRadius: t.radius.button,
          paddingVertical: 18,
          paddingHorizontal: t.spacing.page,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: variant === 'ghost' ? 'center' : 'space-between',
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: isDisabled ? 0.5 : pressed ? 0.92 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center' }}>
          <ActivityIndicator color={fg} />
        </View>
      ) : (
        <>
          <T variant="label" style={{ color: fg, flexShrink: 1 }}>
            {label}
          </T>
          {arrow && variant !== 'ghost' ? <Ionicons name="arrow-forward" size={18} color={fg} style={{ transform: [{ rotate: '-45deg' }], marginLeft: 12 }} /> : null}
        </>
      )}
    </Pressable>
  );
});
