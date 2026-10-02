import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme';
import { T } from './Text';

/**
 * A settings line: title + hint, with a control on the right (`row`) or on its
 * own line below (`stacked` — for chip groups, so they never squeeze the title
 * on narrow phones or at large text). Hairline below.
 */
export function SettingsRow({
  title,
  hint,
  right,
  onPress,
  destructive,
  layout = 'row',
}: {
  title: string;
  hint?: string;
  right?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  layout?: 'row' | 'stacked';
}) {
  const t = useTheme();
  const text = (
    <View style={{ flex: layout === 'row' ? 1 : undefined }}>
      <T variant="body" tone={destructive ? 'destructive' : 'default'}>
        {title}
      </T>
      {hint ? (
        <T variant="meta" tone="secondary" style={{ marginTop: 4, fontSize: 11, lineHeight: 15 }}>
          {hint}
        </T>
      ) : null}
    </View>
  );
  const content = (
    <View style={{ paddingVertical: 17, borderBottomWidth: 1, borderBottomColor: t.colors.line, minHeight: t.targets.min, gap: layout === 'stacked' ? 12 : 0 }}>
      {layout === 'row' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          {text}
          {right}
        </View>
      ) : (
        <>
          {text}
          {right}
        </>
      )}
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title} accessibilityHint={hint}>
      {content}
    </Pressable>
  ) : (
    content
  );
}
