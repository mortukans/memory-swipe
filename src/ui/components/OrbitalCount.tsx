import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { motion, useMotion, useTheme } from '../theme';
import { T } from './Text';

/**
 * Session-end art: a thin orbit with a single terracotta mark that settles into
 * place (450ms spring), around a large kept count. Static under Reduce Motion.
 * The orbit grows with the number at large text sizes.
 */
export function OrbitalCount({ count, unit }: { count: number; unit: string }) {
  const t = useTheme();
  const { reduce } = useMotion();
  const progress = useSharedValue(reduce ? 1 : 0);
  const [numberW, setNumberW] = useState(0);
  useEffect(() => {
    progress.value = reduce ? 1 : withSpring(1, { duration: motion.orbitMs, dampingRatio: 0.86 });
  }, [reduce, progress]);

  const size = Math.max(170, numberW + 48);
  const r = size / 2;

  const markStyle = useAnimatedStyle(() => {
    // Settle from the top of the orbit (−90°) to its resting spot (~−140°).
    const angle = (-90 + -50 * progress.value) * (Math.PI / 180);
    return { transform: [{ translateX: r * Math.cos(angle) }, { translateY: r * Math.sin(angle) }], opacity: 0.4 + 0.6 * progress.value };
  });

  return (
    <View style={{ minHeight: size + 50, alignItems: 'center', justifyContent: 'center' }} accessible accessibilityLabel={`${count} ${unit}`}>
      <View style={{ width: size, height: size, borderRadius: r, borderWidth: 1, borderColor: t.colors.orbit, position: 'absolute' }} />
      <Animated.View style={[{ position: 'absolute', width: 26, height: 26, borderRadius: 13, backgroundColor: t.colors.destructive, borderWidth: 6, borderColor: t.colors.bg }, markStyle]} />
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }} onLayout={(e) => setNumberW(e.nativeEvent.layout.width)}>
        <T maxFontSizeMultiplier={1.4} style={{ fontSize: 68, lineHeight: 72, letterSpacing: -4, fontWeight: '400' }}>
          {count}
        </T>
        <T maxFontSizeMultiplier={1.4} style={{ fontSize: 20, lineHeight: 24 }}>
          {unit}
        </T>
      </View>
    </View>
  );
}
