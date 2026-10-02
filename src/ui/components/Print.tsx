import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { T } from './Text';

/**
 * A physical photo print: paper border, soft shadow, slight tilt.
 * `PrintFrame` is the big review card (children = fitted media, caption below).
 * `PrintThumb` is a small cover-cropped print for stacks, chapters and the review grid.
 */
export function PrintFrame({
  children,
  caption,
  meta,
  rotation = 0,
  style,
}: {
  children: ReactNode;
  caption?: string;
  meta?: string;
  rotation?: number;
  style?: ViewStyle;
}) {
  const t = useTheme();
  const hasCaption = Boolean(caption || meta);
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.print,
          padding: 10,
          paddingBottom: hasCaption ? 44 : 10,
          shadowColor: '#30412C',
          shadowOpacity: 0.14,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 12 },
          elevation: 6,
          transform: [{ rotate: `${rotation}deg` }],
        },
        style,
      ]}
    >
      {children}
      {hasCaption ? (
        <View style={{ position: 'absolute', left: 17, right: 17, bottom: 13, flexDirection: 'row', alignItems: 'baseline', gap: 12 }}>
          {caption ? (
            <T variant="meta" style={{ fontSize: 13, flexShrink: 1 }} numberOfLines={1}>
              {caption}
            </T>
          ) : null}
          {meta ? (
            <T variant="meta" tone="secondary" numberOfLines={1}>
              {meta}
            </T>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function PrintThumb({
  uri,
  width,
  height,
  rotation = 0,
  border = 5,
  radius = 6,
  children,
  style,
}: {
  uri?: string | null;
  width: number;
  height: number;
  rotation?: number;
  border?: number;
  radius?: number;
  children?: ReactNode;
  style?: ViewStyle;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: t.colors.surface,
          padding: border,
          borderRadius: radius,
          shadowColor: '#35452B',
          shadowOpacity: 0.12,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
          elevation: 3,
          transform: [{ rotate: `${rotation}deg` }],
        },
        style,
      ]}
    >
      <View style={{ flex: 1, borderRadius: Math.max(2, radius - 3), overflow: 'hidden', backgroundColor: t.colors.imageBg }}>
        {uri ? <Image source={{ uri }} style={{ flex: 1 }} contentFit="cover" transition={150} cachePolicy="memory-disk" /> : null}
        {children}
      </View>
    </View>
  );
}
