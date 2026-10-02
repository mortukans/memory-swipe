import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useMotion, useTheme } from '../theme';
import { T } from './Text';

/**
 * Session-end art: a thin orbit with a single terracotta mark that settles into
 * place (450ms spring), around a large kept count. Static under Reduce Motion.
 */
export function OrbitalCount({ count, unit }: { count: number; unit: string }) {
  const t = useTheme();
  const { reduce } = useMotion();
  const progress = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    progress.value = reduce ? 1 : withSpring(1, { damping: 14, stiffness: 90 });
  }, [reduce, progress]);

  const markStyle = useAnimatedStyle(() => {
    // Settle from the top of the orbit (−90°) to its resting spot (~−140°).
    const angle = (-90 + (-50 * progress.value)) * (Math.PI / 180);
    const r = 85;
    return { transform: [{ translateX: r * Math.cos(angle) }, { translateY: r * Math.sin(angle) }], opacity: 0.4 + 0.6 * progress.value };
  });

  return (
    <View style={{ height: 220, alignItems: 'center', justifyContent: 'center' }} accessible accessibilityLabel={`${count} ${unit}`}>
      <View style={{ width: 170, height: 170, borderRadius: 85, borderWidth: 1, borderColor: t.colors.orbit, position: 'absolute' }} />
      <Animated.View style={[{ position: 'absolute', width: 26, height: 26, borderRadius: 13, backgroundColor: t.colors.destructive, borderWidth: 6, borderColor: t.colors.bg }, markStyle]} />
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
        <T style={{ fontSize: 68, lineHeight: 72, letterSpacing: -4, fontWeight: '400' }}>{count}</T>
        <T style={{ fontSize: 20, lineHeight: 24 }} tone="default">
          {unit}
        </T>
      </View>
    </View>
  );
}
