import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { T } from './Text';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  fullWidth = true,
  style,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
}) {
  const t = useTheme();
  const bg =
    variant === 'primary'
      ? t.colors.accent
      : variant === 'danger'
        ? t.colors.danger
        : variant === 'secondary'
          ? t.colors.surfaceAlt
          : 'transparent';
  const fg =
    variant === 'primary' ? t.colors.accentText : variant === 'danger' ? '#FFFFFF' : t.colors.text;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: t.radius.pill,
          paddingVertical: 15,
          paddingHorizontal: t.spacing.xl,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: t.spacing.sm,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: t.colors.border,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
          {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
          <T variant="label" style={{ color: fg, fontSize: 16 }}>
            {label}
          </T>
        </View>
      )}
    </Pressable>
  );
}
