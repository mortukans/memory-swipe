import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useMotion, useTheme } from '../theme';
import { PrintThumb } from './Print';

/**
 * The discovery hero: three slightly imperfect prints that drift ±3.5pt over 7s,
 * staggered. Static under Reduce Motion. Pass up to three real thumbnails; any
 * missing slot is a quiet paper placeholder.
 */
export function PrintStack({ uris, height = 230 }: { uris: (string | null | undefined)[]; height?: number }) {
  const t = useTheme();
  const { reduce } = useMotion();
  // Stage is 330 wide, centred; positions from the prototype.
  const stage = 330;
  const prints = [
    { w: 111, h: 145, left: 20, top: 60, rot: -21, delay: 4000, uri: uris[2] },
    { w: 150, h: 201, left: 150, top: 8, rot: 13, delay: 2000, uri: uris[1] },
    { w: 150, h: 201, left: 86, top: 12, rot: -8, delay: 0, uri: uris[0] },
  ];
  return (
    <View style={{ height, alignItems: 'center' }} accessible accessibilityRole="image" accessibilityLabel="">
      <View style={{ width: stage, height }}>
        {prints.map((p, i) => (
          <Drift key={i} delay={p.delay} reduce={reduce} style={{ position: 'absolute', left: p.left, top: p.top }}>
            <PrintThumb uri={p.uri} width={p.w} height={p.h} rotation={p.rot} border={8} radius={5} style={{ paddingBottom: 27, backgroundColor: t.colors.surface }} />
          </Drift>
        ))}
      </View>
    </View>
  );
}

function Drift({ children, delay, reduce, style }: { children: React.ReactNode; delay: number; reduce: boolean; style: object }) {
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduce) {
      y.value = 0;
      return;
    }
    // ±3.5pt around rest: 0 → -7 → 0 over 7s, eased, forever.
    y.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(-7, { duration: 3500, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 3500, easing: Easing.inOut(Easing.ease) })), -1, false),
    );
  }, [reduce, delay, y]);
  const s = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[style, s]}>{children}</Animated.View>;
}
