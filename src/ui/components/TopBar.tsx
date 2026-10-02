import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme';
import { T } from './Text';

/** Back arrow on the left, a centred eyebrow, an optional control on the right. */
export function TopBar({
  eyebrow,
  onBack,
  right,
  backLabel,
}: {
  eyebrow?: string;
  onBack?: () => void;
  right?: ReactNode;
  backLabel: string;
}) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, minHeight: 52 }}>
      <Pressable
        onPress={onBack ?? (() => router.back())}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        style={{ width: 44, height: 44, alignItems: 'flex-start', justifyContent: 'center' }}
      >
        <Ionicons name="arrow-back" size={24} color={t.colors.text} />
      </Pressable>
      {eyebrow ? (
        <T variant="eyebrow" tone="secondary" numberOfLines={1} style={{ flex: 1, textAlign: 'center' }}>
          {eyebrow}
        </T>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      <View style={{ width: 44, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}
