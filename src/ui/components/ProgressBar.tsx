import { View } from 'react-native';
import { useTheme } from '../theme';

/** Thin rounded progress track. fraction is 0..1. */
export function ProgressBar({ fraction, tone = 'accent' }: { fraction: number; tone?: 'accent' | 'keep' }) {
  const t = useTheme();
  const pct = Math.max(0, Math.min(1, fraction));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ now: Math.round(pct * 100), min: 0, max: 100 }}
      style={{ height: 6, borderRadius: 999, backgroundColor: t.colors.surfaceAlt, overflow: 'hidden' }}
    >
      <View
        style={{
          height: '100%',
          width: `${pct * 100}%`,
          backgroundColor: tone === 'keep' ? t.colors.keep : t.colors.accent,
          borderRadius: 999,
        }}
      />
    </View>
  );
}
