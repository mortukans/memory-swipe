import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme';
import { T } from './Text';

/** Soft information card, 18pt radius. */
export function Callout({ title, children }: { title?: string; children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ backgroundColor: t.colors.tile, borderRadius: t.radius.callout, padding: 17, gap: 6 }}>
      {title ? <T variant="label">{title}</T> : null}
      {typeof children === 'string' ? (
        <T variant="meta" tone="secondary" style={{ lineHeight: 19 }}>
          {children}
        </T>
      ) : (
        children
      )}
    </View>
  );
}
