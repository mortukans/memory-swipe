import { Pressable } from 'react-native';
import { useTheme } from '../theme';
import { T } from './Text';

/** Pill filter. Selected = ink fill with paper text. */
export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => ({
        minHeight: 36,
        paddingHorizontal: 13,
        paddingVertical: 8,
        borderRadius: t.radius.pill,
        borderWidth: 1,
        borderColor: selected ? t.colors.text : t.colors.line,
        backgroundColor: selected ? t.colors.text : 'transparent',
        justifyContent: 'center',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <T variant="meta" style={{ fontSize: 12, fontWeight: '500', color: selected ? t.colors.bg : t.colors.text }}>
        {label}
      </T>
    </Pressable>
  );
}
