import { View } from 'react-native';
import { useTheme } from '../theme';

export type RibbonMark = 'keep' | 'remove' | 'skip';

/**
 * The session ribbon: one segment per decision — sage for keep, terracotta for
 * remove, a neutral outline for skip. It records a session, not a score.
 * 5pt tall, 3pt gaps, segments grow in place (no reflow).
 */
export function SessionRibbon({ total, marks }: { total: number; marks: RibbonMark[] }) {
  const t = useTheme();
  const slots = Math.max(total, marks.length, 1);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ now: marks.length, min: 0, max: slots }}
      style={{ height: 5, flexDirection: 'row', gap: 3 }}
    >
      {Array.from({ length: slots }, (_, i) => {
        const m = marks[i];
        const bg = m === 'keep' ? t.colors.ribbonKeep : m === 'remove' ? t.colors.ribbonRemove : t.colors.ribbonTrack;
        return (
          <View
            key={i}
            style={{
              flex: 1,
              height: 5,
              borderRadius: 3,
              backgroundColor: m === 'skip' ? 'transparent' : bg,
              borderWidth: m === 'skip' ? 1 : 0,
              borderColor: t.colors.secondary,
            }}
          />
        );
      })}
    </View>
  );
}
