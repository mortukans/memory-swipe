import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MediaCard, type MediaCardLabels } from './MediaCard';
import type { MediaPreview } from '../../media/types';
import { useTheme } from '../theme';
import { T } from './Text';

const SWIPE_THRESHOLD = 110;

/**
 * Draggable media card. Swipe right = keep, left = remove. The buttons in
 * SwipeControls do the same thing, so the gesture is an enhancement, never the
 * only way. Honours the system "Reduce Motion" setting by skipping the fling.
 */
export function SwipeDeck({
  preview,
  loading,
  error,
  cardKey,
  onKeep,
  onRemove,
  mediaLabels,
  keepBadge,
  removeBadge,
}: {
  preview: MediaPreview | null;
  loading: boolean;
  error: boolean;
  /** Changes whenever the current item changes, so the card recenters. */
  cardKey: string;
  onKeep: () => void;
  onRemove: () => void;
  mediaLabels: MediaCardLabels;
  keepBadge: string;
  removeBadge: string;
}) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const x = useSharedValue(0);
  const y = useSharedValue(0);

  useEffect(() => {
    // New card: snap back to center without animation.
    x.value = 0;
    y.value = 0;
  }, [cardKey, x, y]);

  const fling = (dir: 1 | -1, cb: () => void) => {
    'worklet';
    if (reduceMotion) {
      x.value = 0;
      runOnJS(cb)();
      return;
    }
    x.value = withTiming(dir * width * 1.4, { duration: 220 }, (done) => {
      if (done) runOnJS(cb)();
    });
  };

  const enabled = !!preview && !error;
  const pan = Gesture.Pan()
    .enabled(enabled)
    .onUpdate((e) => {
      x.value = e.translationX;
      y.value = e.translationY * 0.15;
    })
    .onEnd(() => {
      if (x.value > SWIPE_THRESHOLD) fling(1, onKeep);
      else if (x.value < -SWIPE_THRESHOLD) fling(-1, onRemove);
      else {
        x.value = withSpring(0, { damping: 18 });
        y.value = withSpring(0, { damping: 18 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${interpolate(x.value, [-width, 0, width], [-8, 0, 8])}deg` },
    ],
  }));
  const keepStyle = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [20, SWIPE_THRESHOLD], [0, 1], 'clamp') }));
  const removeStyle = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [-SWIPE_THRESHOLD, -20], [1, 0], 'clamp') }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[{ flex: 1 }, cardStyle]}>
        <MediaCard preview={preview} loading={loading} error={error} active labels={mediaLabels} />

        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', top: 24, left: 24 }, badgeBox(t.colors.keep), keepStyle]}
        >
          <Ionicons name="heart" size={18} color={t.colors.keep} />
          <T variant="label" style={{ color: t.colors.keep }}>
            {keepBadge}
          </T>
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', top: 24, right: 24 }, badgeBox(t.colors.remove), removeStyle]}
        >
          <Ionicons name="trash-outline" size={18} color={t.colors.remove} />
          <T variant="label" style={{ color: t.colors.remove }}>
            {removeBadge}
          </T>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

function badgeBox(color: string) {
  return {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: color,
    backgroundColor: 'rgba(0,0,0,0.35)',
  };
}
