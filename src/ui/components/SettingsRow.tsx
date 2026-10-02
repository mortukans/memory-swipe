import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme';
import { T } from './Text';

/** A settings line: title + hint on the left, a control (or value) on the right, hairline below. */
export function SettingsRow({
  title,
  hint,
  right,
  onPress,
  destructive,
}: {
  title: string;
  hint?: string;
  right?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
}) {
  const t = useTheme();
  const content = (
    <View
      style={{
        paddingVertical: 17,
        borderBottomWidth: 1,
        borderBottomColor: t.colors.line,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        minHeight: t.targets.min,
      }}
    >
      <View style={{ flex: 1 }}>
        <T variant="body" tone={destructive ? 'destructive' : 'default'}>
          {title}
        </T>
        {hint ? (
          <T variant="meta" tone="secondary" style={{ marginTop: 4, fontSize: 11 }}>
            {hint}
          </T>
        ) : null}
      </View>
      {right}
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button">
      {content}
    </Pressable>
  ) : (
    content
  );
}
