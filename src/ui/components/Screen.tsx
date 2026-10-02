import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '../theme';

/** Paper page with the 20pt inset and native safe areas. */
export function Screen({
  children,
  edges = ['top', 'bottom'],
  padded = true,
  style,
}: {
  children: ReactNode;
  edges?: Edge[];
  padded?: boolean;
  style?: ViewStyle;
}) {
  const t = useTheme();
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={[{ flex: 1, paddingHorizontal: padded ? t.spacing.page : 0 }, style]}>{children}</View>
    </SafeAreaView>
  );
}
