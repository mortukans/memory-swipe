import { View } from 'react-native';
import { RoundButton } from './RoundButton';

/** Undo · Remove · Skip · Keep — 60pt targets with visible labels. Gestures are never the only way. */
export function DecisionControls({
  onUndo,
  onRemove,
  onSkip,
  onKeep,
  canUndo,
  disabled,
  labels,
}: {
  onUndo: () => void;
  onRemove: () => void;
  onSkip: () => void;
  onKeep: () => void;
  canUndo: boolean;
  disabled?: boolean;
  labels: { undo: string; remove: string; skip: string; keep: string };
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 4 }}>
      <RoundButton icon="arrow-undo-outline" label={labels.undo} onPress={onUndo} size={60} disabled={!canUndo || disabled} />
      <RoundButton icon="remove" label={labels.remove} onPress={onRemove} size={60} tone="remove" disabled={disabled} />
      <RoundButton icon="arrow-forward" label={labels.skip} onPress={onSkip} size={60} disabled={disabled} />
      <RoundButton icon="heart-outline" label={labels.keep} onPress={onKeep} size={60} tone="keep" disabled={disabled} />
    </View>
  );
}
