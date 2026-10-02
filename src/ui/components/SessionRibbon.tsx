import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { motion, useMotion, useTheme } from '../theme';

export type RibbonMark = 'keep' | 'remove' | 'skip';

const GAP = 3;

/**
 * The session ribbon: one continuous 5pt track; each decision adds a segment
 * that grows into place over 180ms — sage for keep, terracotta for remove, a
 * neutral outline for skip. It records a session, not a score. The text label
 * carries the counts so the colour difference is never the only signal.
 */
export function SessionRibbon({ total, marks, accessibilityLabel }: { total: number; marks: RibbonMark[]; accessibilityLabel: string }) {
  const t = useTheme();
  const [trackW, setTrackW] = useState(0);
  const slots = Math.max(total, marks.length, 1);
  const segW = trackW > 0 ? (trackW - GAP * (slots - 1)) / slots : 0;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ now: marks.length, min: 0, max: slots }}
      onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
      style={{ height: 5, borderRadius: 3, backgroundColor: t.colors.ribbonTrack }}
    >
      <View style={{ position: 'absolute', left: 0, top: 0, height: 5, flexDirection: 'row', gap: GAP }}>
        {segW > 0 ? marks.map((m, i) => <Segment key={i} mark={m} width={segW} />) : null}
      </View>
    </View>
  );
}

function Segment({ mark, width }: { mark: RibbonMark; width: number }) {
  const t = useTheme();
  const { reduce } = useMotion();
  const w = useSharedValue(reduce ? width : 0);
  useEffect(() => {
    w.value = reduce ? width : withTiming(width, { duration: motion.ribbonMs, easing: Easing.out(Easing.cubic) });
  }, [width, reduce, w]);
  const style = useAnimatedStyle(() => ({ width: w.value }));
  const color = mark === 'keep' ? t.colors.ribbonKeep : mark === 'remove' ? t.colors.ribbonRemove : 'transparent';
  return (
    <Animated.View
      style={[
        {
          height: 5,
          borderRadius: 3,
          backgroundColor: color,
          borderWidth: mark === 'skip' ? 1 : 0,
          borderColor: t.colors.secondary,
        },
        style,
      ]}
    />
  );
}
