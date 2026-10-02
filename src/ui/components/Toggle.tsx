import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useMotion, useTheme } from '../theme';

/** 45×28 switch: outlined muted track off, ink track on; the knob keeps contrast in both modes. */
export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const t = useTheme();
  const { reduce } = useMotion();
  const x = useSharedValue(value ? 17 : 0);
  useEffect(() => {
    x.value = reduce ? (value ? 17 : 0) : withTiming(value ? 17 : 0, { duration: 180, easing: Easing.out(Easing.cubic) });
  }, [value, reduce, x]);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const knobColor = value ? (t.dark ? t.colors.bg : '#FFFFFF') : t.dark ? t.colors.text : '#FFFFFF';
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      hitSlop={8}
      style={{
        width: 45,
        height: 28,
        borderRadius: 25,
        padding: 3,
        backgroundColor: value ? t.colors.text : t.colors.toggleOff,
        borderWidth: value ? 0 : 1,
        borderColor: t.colors.toggleOffBorder,
        justifyContent: 'center',
      }}
    >
      <Animated.View style={[{ width: 22, height: 22, borderRadius: 11, backgroundColor: knobColor, marginLeft: value ? -1 : 0 }, knob]} />
    </Pressable>
  );
}
