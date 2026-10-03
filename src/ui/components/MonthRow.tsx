import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme';
import { PrintThumb } from './Print';
import { T } from './Text';

/** A chapter row: tilted print thumbnail, title, count, a thin progress line, ↗. */
export function MonthRow({
  title,
  sub,
  uri,
  fraction,
  onPress,
}: {
  title: string;
  sub: string;
  uri?: string | null;
  /** 0..1 reviewed. Shown as shape + text elsewhere; here as a thin line. Omit for rows without progress (albums). */
  fraction?: number;
  onPress: () => void;
}) {
  const t = useTheme();
  const pct = fraction == null ? null : Math.max(0, Math.min(1, fraction));
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${sub}`}
      accessibilityValue={pct == null ? undefined : { now: Math.round(pct * 100), min: 0, max: 100 }}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, minHeight: 88, opacity: pressed ? 0.85 : 1 })}
    >
      <PrintThumb uri={uri} width={65} height={78} rotation={-5} border={5} radius={6} />
      <View style={{ flex: 1 }}>
        <T variant="body" style={{ fontSize: 17, fontWeight: '500' }}>
          {title}
        </T>
        <T variant="meta" tone="secondary" style={{ marginTop: 6, fontSize: 11 }}>
          {sub}
        </T>
        {pct == null ? null : (
          <View style={{ height: 3, width: 120, backgroundColor: t.colors.ribbonTrack, marginTop: 12 }}>
            <View style={{ height: 3, width: `${pct * 100}%`, backgroundColor: t.colors.ribbonKeep }} />
          </View>
        )}
      </View>
      <Ionicons name="arrow-up-outline" size={18} color={t.colors.text} style={{ transform: [{ rotate: '45deg' }] }} />
    </Pressable>
  );
}
