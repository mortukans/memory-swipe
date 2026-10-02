import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme';
import { T } from './Text';

function RoundButton({
  icon,
  label,
  color,
  onPress,
  disabled,
  size = 64,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
}) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !!disabled }}
        style={({ pressed }) => ({
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: t.colors.surface,
          borderWidth: 2,
          borderColor: color,
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
        })}
      >
        <Ionicons name={icon} size={size * 0.42} color={color} />
      </Pressable>
      <T variant="caption" tone="dim">
        {label}
      </T>
    </View>
  );
}

/** The four swipe actions as buttons — the accessible alternative to gestures. */
export function SwipeControls({
  onKeep,
  onRemove,
  onSkip,
  onUndo,
  canUndo,
  labels,
}: {
  onKeep: () => void;
  onRemove: () => void;
  onSkip: () => void;
  onUndo: () => void;
  canUndo: boolean;
  labels: { keep: string; remove: string; skip: string; undo: string };
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: t.spacing.sm,
      }}
    >
      <RoundButton icon="arrow-undo" label={labels.undo} color={t.colors.skip} onPress={onUndo} disabled={!canUndo} size={52} />
      <RoundButton icon="trash-outline" label={labels.remove} color={t.colors.remove} onPress={onRemove} />
      <RoundButton icon="play-skip-forward" label={labels.skip} color={t.colors.skip} onPress={onSkip} size={52} />
      <RoundButton icon="heart" label={labels.keep} color={t.colors.keep} onPress={onKeep} />
    </View>
  );
}
