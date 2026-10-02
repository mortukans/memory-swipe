import { Pressable } from 'react-native';
import { useTheme } from '../theme';
import { T } from './Text';

/** Soft filled pill; selected = ink fill with paper text. 36pt tall with 4pt hit slop (44pt effective). */
export function Chip({ label, selected, onPress, accessibilityLabel }: { label: string; selected?: boolean; onPress: () => void; accessibilityLabel?: string }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: !!selected }}
      hitSlop={{ top: 4, bottom: 4 }}
      style={({ pressed }) => ({
        minHeight: 36,
        paddingHorizontal: 13,
        paddingVertical: 8,
        borderRadius: t.radius.pill,
        backgroundColor: selected ? t.colors.text : pressed ? t.colors.line : t.colors.tile,
        justifyContent: 'center',
      })}
    >
      <T variant="meta" style={{ fontSize: 12, fontWeight: '500', color: selected ? t.colors.bg : t.colors.text }}>
        {label}
      </T>
    </Pressable>
  );
}
