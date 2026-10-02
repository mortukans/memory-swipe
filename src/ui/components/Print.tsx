import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { T } from './Text';

/**
 * A physical photo print: paper border, soft shadow, slight tilt.
 * `PrintFrame` is the big review card (children = fitted media; caption flows
 * BELOW the photo and wraps, so it never overlaps the image at any text size).
 * `PrintThumb` is a small cover-cropped print for stacks, chapters and the grid.
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
          shadowColor: '#30412C',
          shadowOpacity: 0.125,
          shadowRadius: 17,
          shadowOffset: { width: 0, height: 14 },
          elevation: 4,
          transform: [{ rotate: `${rotation}deg` }],
        },
        style,
      ]}
    >
      <View style={{ flex: 1 }}>{children}</View>
      {hasCaption ? (
        <View style={{ paddingTop: 12, paddingHorizontal: 7, paddingBottom: 3, minHeight: 25, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 12, rowGap: 2 }}>
          {caption ? (
            <T variant="meta" style={{ fontSize: 12, lineHeight: 16 }}>
              {caption}
            </T>
          ) : null}
          {meta ? (
            <T variant="meta" tone="secondary">
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
          shadowOpacity: 0.125,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 8 },
          elevation: 2,
          transform: [{ rotate: `${rotation}deg` }],
        },
        style,
      ]}
    >
      <View style={{ flex: 1, borderRadius: Math.max(2, radius - 3), overflow: 'hidden', backgroundColor: t.colors.imageBg }} accessibilityIgnoresInvertColors>
        {uri ? <Image source={{ uri }} style={{ flex: 1 }} contentFit="cover" transition={150} cachePolicy="memory" recyclingKey={uri} /> : null}
        {children}
      </View>
    </View>
  );
}
