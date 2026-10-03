import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import type { MediaPreview } from '../../media/types';
import { haptic } from '../haptics';
import { motion, useMotion, useTheme } from '../theme';
import { FittedMedia, type FittedMediaLabels } from './FittedMedia';
import { PrintFrame } from './Print';
import { T } from './Text';

export type DeckCommit = 'keep' | 'remove' | 'skip';

export interface SwipeDeckHandle {
  /** Animate the card out as if swiped, then fire the decision. Used by the labelled buttons. */
  commit: (dir: DeckCommit) => void;
}

/**
 * The review card as a physical print. x follows the finger; tilt is x/18
 * clamped to ±12°; the stamp fades in as |x|/90. A commit (≥85pt, or a projected
 * end ≥120pt with clear horizontal intent) flies the card off at 240ms and only
 * then fires the decision — duplicates are blocked while animating and the
 * parent is told (`onBusyChange`) so the buttons can disable too. Anything less
 * springs back (300ms, ζ 0.8). One light haptic when crossing the threshold
 * (latched), one soft one on commit. Reduce Motion: translation without tilt,
 * 120ms crossfades, instant snapback.
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
    /** Full VoiceOver label: kind, index, date… built by the screen. */
    accessibilityLabel: string;
    accessibilityHint: string;
    /** False while the media failed to load — Keep/Remove are then refused. */
    canDecide: boolean;
    canUndo: boolean;
    /** False when the screen is covered/unfocused: pauses video. */
    active: boolean;
    onKeep: () => void | Promise<void>;
    onRemove: () => void | Promise<void>;
    onSkip: () => void | Promise<void>;
    onUndo: () => void;
    onRetry: () => void;
    onBusyChange?: (busy: boolean) => void;
    /** The media for this card failed to load (Keep/Remove are refused by the screen). */
    onMediaFailed?: (failed: boolean) => void;
    mediaLabels: FittedMediaLabels;
    labels: { keep: string; remove: string; skip: string; undo: string };
    haptics: boolean;
  }
>(function SwipeDeck(props, ref) {
  const { preview, loading, error, cardKey, caption, meta, active, mediaLabels, labels, haptics } = props;
  const t = useTheme();
  const { reduce } = useMotion();

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const rot = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const busy = useSharedValue(0);
  const latched = useSharedValue(0);

  // Latest callbacks/flags, so animation-completion closures never go stale.
  const latest = useRef(props);
  latest.current = props;

  const thresholdHaptic = () => haptic('light', latest.current.haptics);
  const commitHaptic = () => haptic('select', latest.current.haptics);
  // A decision that fails to persist must not leave an invisible, locked card.
  const fire = (dir: DeckCommit) => {
    const cb = dir === 'keep' ? latest.current.onKeep : dir === 'remove' ? latest.current.onRemove : latest.current.onSkip;
    Promise.resolve()
      .then(() => cb())
      .catch(() => abort());
  };
  const setBusy = (v: boolean) => latest.current.onBusyChange?.(v);
  const onFailedChange = useCallback((f: boolean) => latest.current.onMediaFailed?.(f), []);
  // The remove stamp sits on a dark tint in dark mode: use the light text colour there.
  const stampInk = t.dark ? t.colors.text : t.colors.ink;
  /** A fly-out that was cancelled (e.g. the app was interrupted mid-animation) must never leave the deck locked. */
  const abort = () => {
    busy.value = 0;
    latched.value = 0;
    x.value = 0;
    y.value = 0;
    rot.value = 0;
    opacity.value = 1;
    setBusy(false);
  };

  // New card: recenter instantly; the next print arrives from 98% → 100% (or crossfades).
  useEffect(() => {
    x.value = 0;
    y.value = 0;
    rot.value = 0;
    latched.value = 0;
    busy.value = 0;
    setBusy(false);
    if (reduce) {
      scale.value = 1;
      opacity.value = 0;
      opacity.value = withTiming(1, { duration: motion.reduceMs });
    } else {
      opacity.value = 1;
      scale.value = 0.98;
      scale.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardKey, reduce]);

  /** JS-side commit (buttons/a11y call it directly; the gesture via runOnJS). */
  const commitTo = (dir: DeckCommit) => {
    if (busy.value) return;
    if ((dir === 'keep' || dir === 'remove') && !latest.current.canDecide) return;
    busy.value = 1;
    setBusy(true);
    commitHaptic();
    const done = () => fire(dir);
    if (reduce || dir === 'skip') {
      opacity.value = withTiming(0, { duration: motion.reduceMs }, (finished) => {
        if (finished) runOnJS(done)();
        else runOnJS(abort)();
      });
      return;
    }
    const sign = dir === 'keep' ? 1 : -1;
    rot.value = withTiming(sign * 18, { duration: motion.commitMs, easing: Easing.out(Easing.cubic) });
    x.value = withTiming(sign * 420, { duration: motion.commitMs, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(0, { duration: motion.commitMs }, (finished) => {
      if (finished) runOnJS(done)();
      else runOnJS(abort)();
    });
  };

  useImperativeHandle(ref, () => ({ commit: commitTo }));

  const snapBack = () => {
    'worklet';
    latched.value = 0;
    if (reduce) {
      x.value = 0;
      y.value = 0;
      rot.value = 0;
      return;
    }
    const cfg = { duration: motion.snapbackMs, dampingRatio: motion.snapbackDamping };
    x.value = withSpring(0, cfg);
    y.value = withSpring(0, cfg);
    rot.value = withSpring(0, cfg);
  };

  const enabled = !!preview && !error && props.canDecide;
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
        runOnJS(commitTo)((Math.abs(tx) >= motion.translationThreshold ? tx : projected) > 0 ? 'keep' : 'remove');
        return;
      }
      snapBack();
    })
    .onFinalize((_e, success) => {
      if (!success && !busy.value) snapBack();
    });

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: x.value }, { translateY: y.value }, { rotate: `${motion.restRotationDeg + rot.value}deg` }, { scale: scale.value }],
  }));
  const keepStamp = useAnimatedStyle(() => ({ opacity: x.value > 0 ? Math.min(x.value / 90, 1) : 0 }));
  const removeStamp = useAnimatedStyle(() => ({ opacity: x.value < 0 ? Math.min(-x.value / 90, 1) : 0 }));

  const actions = [
    ...(props.canDecide ? [{ name: 'keep', label: labels.keep }, { name: 'remove', label: labels.remove }] : []),
    ...(error ? [{ name: 'retry', label: mediaLabels.retry }] : []),
    { name: 'skip', label: labels.skip },
    ...(props.canUndo ? [{ name: 'undo', label: labels.undo }] : []),
  ];

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[{ flex: 1 }, cardStyle]}
        accessible
        accessibilityRole="image"
        accessibilityLabel={props.accessibilityLabel}
        accessibilityHint={props.accessibilityHint}
        accessibilityActions={actions}
        onAccessibilityAction={(e) => {
          const a = e.nativeEvent.actionName;
          if (a === 'keep' || a === 'remove' || a === 'skip') commitTo(a);
          else if (a === 'retry') latest.current.onRetry();
          else if (a === 'undo' && !busy.value) latest.current.onUndo();
        }}
      >
        <PrintFrame caption={caption} meta={meta} rotation={0}>
          <FittedMedia
            preview={preview}
            loading={loading}
            error={error}
            active={active}
            labels={mediaLabels}
            onRetry={props.onRetry}
            onFailedChange={onFailedChange}
          />
        </PrintFrame>

        {/* Stamps: ink-bordered, tilted, fade in with the drag. Decorative only. */}
        <Animated.View pointerEvents="none" style={[stampBase(t.colors.accent, t.colors.ink), keepStamp]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <T style={{ fontSize: 25, lineHeight: 30, fontWeight: '700', color: t.colors.ink }} maxFontSizeMultiplier={1.2}>
            {labels.keep}
          </T>
        </Animated.View>
        <Animated.View pointerEvents="none" style={[stampBase(t.colors.removeTint, stampInk), removeStamp]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <T style={{ fontSize: 25, lineHeight: 30, fontWeight: '700', color: stampInk }} maxFontSizeMultiplier={1.2}>
            {labels.remove}
          </T>
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
    padding: 9,
    borderWidth: 3,
    borderColor: border,
    borderRadius: 7,
    backgroundColor: bg,
    transform: [{ rotate: '-12deg' }],
  };
}
