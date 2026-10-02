import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme';
import { ProgressBar } from './ProgressBar';
import { T } from './Text';

/** A collection entry on the home screen: icon, title, subtitle, review progress. */
export function CollectionTile({
  title,
  subtitle,
  icon,
  remaining,
  total,
  onPress,
  accent,
}: {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  remaining: number;
  total: number;
  onPress: () => void;
  accent?: boolean;
}) {
  const t = useTheme();
  const reviewed = Math.max(0, total - remaining);
  const fraction = total === 0 ? 1 : reviewed / total;
  const done = total > 0 && remaining === 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
      style={({ pressed }) => ({
        backgroundColor: accent ? t.colors.accent : t.colors.surface,
        borderRadius: t.radius.md,
        padding: t.spacing.lg,
        borderWidth: accent ? 0 : 1,
        borderColor: t.colors.border,
        opacity: pressed ? 0.9 : 1,
        gap: t.spacing.md,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: t.radius.sm,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: accent ? 'rgba(255,255,255,0.18)' : t.colors.surfaceAlt,
          }}
        >
          <Ionicons name={icon} size={22} color={accent ? t.colors.accentText : t.colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <T variant="heading" style={accent ? { color: t.colors.accentText } : undefined}>
            {title}
          </T>
          {subtitle ? (
            <T variant="caption" tone={accent ? 'inverse' : 'dim'} style={accent ? { opacity: 0.9 } : undefined}>
              {subtitle}
            </T>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={accent ? t.colors.accentText : t.colors.textFaint} />
      </View>
      {total > 0 && !accent ? (
        <View style={{ gap: 6 }}>
          <ProgressBar fraction={fraction} tone={done ? 'keep' : 'accent'} />
          <T variant="caption" tone="faint">
            {done ? '✓' : `${reviewed}/${total}`}
          </T>
        </View>
      ) : null}
    </Pressable>
  );
}
