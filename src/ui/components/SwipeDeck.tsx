import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import type { MediaPreview } from '../../media/types';
import { haptic } from '../haptics';
import { motion, useMotion, useTheme } from '../theme';
import { FittedMedia, type FittedMediaLabels } from './FittedMedia';
import { PrintFrame } from './Print';
import { T } from './Text';

export interface SwipeDeckHandle {
  /** Animate the card out as if swiped, then fire the decision. Used by the labelled buttons. */
  commit: (dir: 'keep' | 'remove') => void;
}

/**
 * The review card as a physical print. x follows the finger; tilt is x/18
 * clamped to ±12°; the stamp fades in as |x|/90. A commit (≥85pt, or a projected
 * end ≥120pt with clear horizontal intent) flies the card off at 240ms and only
 * then fires the decision — duplicates are blocked while animating. Anything
 * less springs back. One light haptic when crossing the threshold (latched),
 * one soft one on commit. Reduce Motion: translation without tilt, 120ms
 * crossfades, instant snapback.
 */
export const SwipeDeck = forwardRef<
  SwipeDeckHandle,
  {
    preview: MediaPreview | null;
    loading: boolean;
    error: boolean;
    /** Changes with the current item so the card recenters and the next one arrives. */
    cardKey: string;
    caption?: string;
    meta?: string;
    onKeep: () => void;
    onRemove: () => void;
    mediaLabels: FittedMediaLabels;
    keepLabel: string;
    removeLabel: string;
    haptics: boolean;
  }
>(function SwipeDeck({ preview, loading, error, cardKey, caption, meta, onKeep, onRemove, mediaLabels, keepLabel, removeLabel, haptics }, ref) {
  const t = useTheme();
  const { reduce } = useMotion();

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const rot = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const busy = useSharedValue(0);
  const latched = useSharedValue(0);

  // Latest callbacks, so the animation-completion closure never goes stale.
  const keepRef = useRef(onKeep);
  const removeRef = useRef(onRemove);
  keepRef.current = onKeep;
  removeRef.current = onRemove;
  const hapticsRef = useRef(haptics);
  hapticsRef.current = haptics;

  const thresholdHaptic = () => haptic('light', hapticsRef.current);
  const commitHaptic = () => haptic('select', hapticsRef.current);
  const fireKeep = () => keepRef.current();
  const fireRemove = () => removeRef.current();

  // New card: recenter instantly; the next print arrives from 98% → 100%.
  useEffect(() => {
    x.value = 0;
    y.value = 0;
    rot.value = 0;
    opacity.value = 1;
    latched.value = 0;
    busy.value = 0;
    if (reduce) scale.value = 1;
    else {
      scale.value = 0.98;
      scale.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) });
    }
  }, [cardKey, reduce, x, y, rot, opacity, scale, latched, busy]);

  /** JS-side commit (buttons call it directly; the gesture via runOnJS). */
  const commitTo = (dir: 1 | -1) => {
    if (busy.value) return;
    busy.value = 1;
    commitHaptic();
    const done = dir > 0 ? fireKeep : fireRemove;
    if (reduce) {
      opacity.value = withTiming(0, { duration: motion.reduceMs }, (finished) => {
        if (finished) runOnJS(done)();
      });
      return;
    }
    rot.value = withTiming(dir * 18, { duration: motion.commitMs, easing: Easing.out(Easing.cubic) });
    x.value = withTiming(dir * 420, { duration: motion.commitMs, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(0, { duration: motion.commitMs }, (finished) => {
      if (finished) runOnJS(done)();
    });
  };

  useImperativeHandle(ref, () => ({ commit: (dir) => commitTo(dir === 'keep' ? 1 : -1) }));

  const enabled = !!preview && !error;
  const pan = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX([-12, 12])
    .failOffsetY([-18, 18])
    .onUpdate((e) => {
      if (busy.value) return;
      x.value = e.translationX;
      y.value = e.translationY * 0.1;
      rot.value = reduce ? 0 : Math.max(-motion.maxRotationDeg, Math.min(motion.maxRotationDeg, e.translationX / 18));
      const over = Math.abs(e.translationX) >= motion.translationThreshold;
      if (over && !latched.value) {
        latched.value = 1;
        runOnJS(thresholdHaptic)();
      } else if (!over && latched.value) {
        latched.value = 0;
      }
    })
    .onEnd((e) => {
      if (busy.value) return;
      const tx = e.translationX;
      const projected = tx + e.velocityX * 0.2;
      const horizontal = Math.abs(tx) > Math.abs(e.translationY);
      if (horizontal && (Math.abs(tx) >= motion.translationThreshold || Math.abs(projected) >= motion.projectedThreshold)) {
        runOnJS(commitTo)((Math.abs(tx) >= motion.translationThreshold ? tx : projected) > 0 ? 1 : -1);
        return;
      }
      latched.value = 0;
      if (reduce) {
        x.value = 0;
        y.value = 0;
        rot.value = 0;
      } else {
        x.value = withSpring(0, { damping: 16, stiffness: 180 });
        y.value = withSpring(0, { damping: 16, stiffness: 180 });
        rot.value = withSpring(0, { damping: 16, stiffness: 180 });
      }
    })
    .onFinalize((_e, success) => {
      // A cancelled touch returns the card to origin.
      if (!success && !busy.value) {
        latched.value = 0;
        x.value = reduce ? 0 : withSpring(0, { damping: 16, stiffness: 180 });
        y.value = reduce ? 0 : withSpring(0, { damping: 16, stiffness: 180 });
        rot.value = reduce ? 0 : withSpring(0, { damping: 16, stiffness: 180 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: x.value }, { translateY: y.value }, { rotate: `${motion.restRotationDeg + rot.value}deg` }, { scale: scale.value }],
  }));
  const keepStamp = useAnimatedStyle(() => ({ opacity: x.value > 0 ? Math.min(x.value / 90, 1) : 0 }));
  const removeStamp = useAnimatedStyle(() => ({ opacity: x.value < 0 ? Math.min(-x.value / 90, 1) : 0 }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[{ flex: 1 }, cardStyle]}
        accessible
        accessibilityLabel={[caption, meta].filter(Boolean).join(', ')}
        accessibilityHint={`${keepLabel} / ${removeLabel}`}
        accessibilityActions={[
          { name: 'keep', label: keepLabel },
          { name: 'remove', label: removeLabel },
        ]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'keep') commitTo(1);
          if (e.nativeEvent.actionName === 'remove') commitTo(-1);
        }}
      >
        <PrintFrame caption={caption} meta={meta} rotation={0}>
          <FittedMedia preview={preview} loading={loading} error={error} active labels={mediaLabels} />
        </PrintFrame>

        {/* Stamps: ink-bordered, tilted, fade in with the drag. Decorative only. */}
        <Animated.View pointerEvents="none" style={[stampBase(t.colors.accent, t.colors.ink), keepStamp]} accessibilityElementsHidden importantForAccessibility="no">
          <T style={{ fontSize: 25, fontWeight: '700', color: t.colors.ink }}>{keepLabel}</T>
        </Animated.View>
        <Animated.View pointerEvents="none" style={[stampBase(t.colors.removeTint, t.colors.ink), removeStamp]} accessibilityElementsHidden importantForAccessibility="no">
          <T style={{ fontSize: 25, fontWeight: '700', color: t.colors.ink }}>{removeLabel}</T>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
});

function stampBase(bg: string, border: string) {
  return {
    position: 'absolute' as const,
    top: 35,
    left: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 3,
    borderColor: border,
    borderRadius: 7,
    backgroundColor: bg,
    transform: [{ rotate: '-12deg' }],
  };
}
