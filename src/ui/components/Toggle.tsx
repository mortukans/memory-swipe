import { Pressable, View } from 'react-native';
import { useTheme } from '../theme';

/** 45×28 switch: muted track off, ink track on, white knob. */
export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const t = useTheme();
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
        justifyContent: 'center',
        alignItems: value ? 'flex-end' : 'flex-start',
      }}
    >
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF' }} />
    </Pressable>
  );
}
