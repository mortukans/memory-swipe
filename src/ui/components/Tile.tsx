import { Pressable } from 'react-native';
import { useTheme } from '../theme';
import { T } from './Text';

/** Discover entry tile: title + a quiet count line. 20pt radius, soft fill. */
export function Tile({ title, sub, onPress }: { title: string; sub: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${sub}`}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: t.colors.tile,
        borderRadius: t.radius.tile,
        borderWidth: 1,
        borderColor: t.colors.line,
        padding: t.spacing.lg,
        minHeight: 88,
        justifyContent: 'center',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <T variant="heading">{title}</T>
      <T variant="meta" tone="secondary" style={{ marginTop: 5 }}>
        {sub}
      </T>
    </Pressable>
  );
}
