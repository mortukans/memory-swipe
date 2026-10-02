import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme';
import { PrintThumb } from './Print';
import { T } from './Text';

/** A queued item in the review grid. Tap restores it (pulls it out of the queue). */
export function ReviewTile({
  uri,
  size,
  isVideo,
  isFavorite,
  keepLabel,
  accessibilityLabel,
  accessibilityHint,
  onRestore,
}: {
  uri?: string | null;
  size: number;
  isVideo?: boolean;
  isFavorite?: boolean;
  keepLabel: string;
  accessibilityLabel: string;
  accessibilityHint: string;
  onRestore: () => void;
}) {
  const t = useTheme();
  const pill = { backgroundColor: t.colors.badge, borderRadius: 20, paddingHorizontal: 6, paddingVertical: 4, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4 };
  return (
    <Pressable
      onPress={onRestore}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <PrintThumb uri={uri} width={size} height={size / 0.8} border={5} radius={8}>
        <View style={{ position: 'absolute', left: 3, bottom: 3, ...pill, paddingHorizontal: 7, paddingVertical: 5 }}>
          <Ionicons name="arrow-undo" size={11} color="#FFFFFF" />
          <T variant="meta" maxFontSizeMultiplier={1.4} style={{ fontSize: 11, lineHeight: 13, color: '#FFFFFF', fontWeight: '600' }}>
            {keepLabel}
          </T>
        </View>
        {isVideo ? (
          <View style={{ position: 'absolute', right: 3, top: 3, ...pill }}>
            <Ionicons name="videocam" size={12} color="#FFFFFF" />
          </View>
        ) : null}
        {isFavorite ? (
          <View style={{ position: 'absolute', left: 3, top: 3, ...pill }}>
            <Ionicons name="heart" size={12} color={t.colors.accent} />
          </View>
        ) : null}
      </PrintThumb>
    </Pressable>
  );
}
