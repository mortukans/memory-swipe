import { useEffect } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { motion, useMotion } from '../theme';
import { PrintThumb } from './Print';

/**
 * The discovery hero: three slightly imperfect prints that drift ±3.5pt over 7s,
 * each starting at a different phase (as the prototype's negative delays do).
 * Static under Reduce Motion, paused when the screen is not focused. Scales
 * down on narrow phones so it never breaks the 20pt inset. Decorative: hidden
 * from VoiceOver.
 */
export function PrintStack({ uris, height = 230, paused = false }: { uris: (string | null | undefined)[]; height?: number; paused?: boolean }) {
  const { width } = useWindowDimensions();
  const { reduce } = useMotion();
  const stage = Math.min(330, width - 40);
  const k = stage / 330;
  const prints = [
    { w: 111, h: 145, left: 20, top: 60, rot: -21, phase: 4000, uri: uris[2] },
    { w: 150, h: 201, left: 150, top: 8, rot: 13, phase: 2000, uri: uris[1] },
    { w: 150, h: 201, left: 86, top: 12, rot: -8, phase: 0, uri: uris[0] },
  ];
  return (
    <View style={{ height: height * k, alignItems: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={{ width: stage, height: height * k }}>
        {prints.map((p, i) => (
          <Drift key={i} phase={p.phase} still={reduce || paused} style={{ position: 'absolute', left: p.left * k, top: p.top * k }}>
            <PrintThumb uri={p.uri} width={p.w * k} height={p.h * k} rotation={p.rot} border={Math.round(8 * k)} radius={5} style={{ paddingBottom: Math.round(27 * k) }} />
          </Drift>
        ))}
      </View>
    </View>
  );
}

const HALF = motion.driftMs / 2;
const AMP = -7;

function Drift({ children, phase, still, style }: { children: React.ReactNode; phase: number; still: boolean; style: object }) {
  const y = useSharedValue(0);
  useEffect(() => {
    if (still) {
      cancelAnimation(y);
      y.value = withTiming(0, { duration: 200 });
      return;
    }
    const ease = Easing.inOut(Easing.ease);
    const cycle = withSequence(withTiming(AMP, { duration: HALF, easing: ease }), withTiming(0, { duration: HALF, easing: ease }));
    const p = phase % motion.driftMs;
    if (p < HALF) {
      y.value = AMP * (p / HALF);
      y.value = withSequence(withTiming(AMP, { duration: HALF - p, easing: ease }), withTiming(0, { duration: HALF, easing: ease }), withRepeat(cycle, -1, false));
    } else {
      const q = p - HALF;
      y.value = AMP - AMP * (q / HALF);
      y.value = withSequence(withTiming(0, { duration: HALF - q, easing: ease }), withRepeat(cycle, -1, false));
    }
    return () => cancelAnimation(y);
  }, [still, phase, y]);
  const s = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[style, s]}>{children}</Animated.View>;
}
