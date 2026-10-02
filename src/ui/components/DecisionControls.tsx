import { PixelRatio, View } from 'react-native';
import { RoundButton } from './RoundButton';

/**
 * Undo · Remove · Skip · Keep — 60pt targets with visible labels. Gestures are
 * never the only way. At large text sizes the row wraps into a 2×2 grid so the
 * labels never collide. `disabled` freezes everything (during the fly-out);
 * `decisionsDisabled` only Keep/Remove (when the media failed to load).
 */
export function DecisionControls({
  onUndo,
  onRemove,
  onSkip,
  onKeep,
  canUndo,
  disabled,
  decisionsDisabled,
  labels,
  hints,
}: {
  onUndo: () => void;
  onRemove: () => void;
  onSkip: () => void;
  onKeep: () => void;
  canUndo: boolean;
  disabled?: boolean;
  decisionsDisabled?: boolean;
  labels: { undo: string; remove: string; skip: string; keep: string };
  hints?: { undo?: string; remove?: string; skip?: string; keep?: string };
}) {
  const grid = PixelRatio.getFontScale() >= 1.5;
  const cell = grid ? { width: '50%' as const, alignItems: 'center' as const } : undefined;
  return (
    <View style={grid ? { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 } : { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 4 }}>
      <View style={cell}>
        <RoundButton icon="arrow-undo-outline" label={labels.undo} accessibilityHint={hints?.undo} onPress={onUndo} size={60} disabled={!canUndo || disabled} />
      </View>
      <View style={cell}>
        <RoundButton icon="remove" label={labels.remove} accessibilityHint={hints?.remove} onPress={onRemove} size={60} tone="remove" disabled={disabled || decisionsDisabled} />
      </View>
      <View style={cell}>
        <RoundButton icon="arrow-forward" label={labels.skip} accessibilityHint={hints?.skip} onPress={onSkip} size={60} disabled={disabled} />
      </View>
      <View style={cell}>
        <RoundButton icon="heart-outline" label={labels.keep} accessibilityHint={hints?.keep} onPress={onKeep} size={60} tone="keep" disabled={disabled || decisionsDisabled} />
      </View>
    </View>
  );
}
