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
  onRestore,
}: {
  uri?: string | null;
  size: number;
  isVideo?: boolean;
  isFavorite?: boolean;
  keepLabel: string;
  onRestore: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable onPress={onRestore} accessibilityRole="button" accessibilityLabel={keepLabel} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <PrintThumb uri={uri} width={size} height={size / 0.8} border={5} radius={8}>
        <View style={{ position: 'absolute', left: 3, bottom: 3, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(36,42,37,0.8)', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 5 }}>
          <Ionicons name="arrow-undo" size={10} color="#FFFFFF" />
          <T variant="meta" style={{ fontSize: 10, color: '#FFFFFF', fontWeight: '600' }}>
            {keepLabel}
          </T>
        </View>
        {isVideo ? (
          <View style={{ position: 'absolute', right: 4, top: 4 }}>
            <Ionicons name="videocam" size={12} color="#FFFFFF" />
          </View>
        ) : null}
        {isFavorite ? (
          <View style={{ position: 'absolute', left: 4, top: 4 }}>
            <Ionicons name="heart" size={12} color={t.colors.accent} />
          </View>
        ) : null}
      </PrintThumb>
    </Pressable>
  );
}
