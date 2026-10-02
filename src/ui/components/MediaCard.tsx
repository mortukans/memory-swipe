import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import type { MediaPreview } from '../../media/types';
import { useTheme } from '../theme';
import { T } from './Text';

export interface MediaCardLabels {
  loading: string;
  unavailableTitle: string;
  unavailableBody: string;
  downloadingTitle: string;
  downloadingBody: string;
}

/**
 * One full-bleed media card. Photos and videos are shown uncropped (contentFit
 * "contain") over a dimmed cover of the same image so the card never shows empty
 * bars. Videos use the system's native controls (play/pause, scrub, sound) and
 * start muted; playback is paused whenever the card is not the active one.
 */
export function MediaCard({
  preview,
  loading,
  error,
  active,
  labels,
}: {
  preview: MediaPreview | null;
  loading: boolean;
  error: boolean;
  active: boolean;
  labels: MediaCardLabels;
}) {
  const t = useTheme();
  const isVideo = preview?.kind === 'video';

  const player = useVideoPlayer(isVideo ? preview!.uri : null, (p) => {
    p.loop = true;
    p.muted = true;
  });

  // Pause when this card is not active (e.g. mid-swipe-out or after a decision).
  useEffect(() => {
    if (!player) return;
    try {
      if (active && isVideo) player.play();
      else player.pause();
    } catch {
      /* player may have been released */
    }
  }, [player, active, isVideo, preview?.uri]);

  return (
    <View
      style={{
        flex: 1,
        borderRadius: t.radius.lg,
        overflow: 'hidden',
        backgroundColor: t.colors.surface,
        borderWidth: 1,
        borderColor: t.colors.border,
      }}
    >
      {preview && !error ? (
        <>
          {/* Dimmed cover backdrop to fill unused space */}
          {preview.kind === 'photo' ? (
            <Image
              source={{ uri: preview.uri }}
              style={{ ...absFill }}
              contentFit="cover"
              transition={120}
              cachePolicy="memory-disk"
            />
          ) : null}
          <View style={{ ...absFill, backgroundColor: t.colors.scrim }} />

          {/* Foreground media, uncropped */}
          {isVideo ? (
            <VideoView player={player} style={{ flex: 1 }} contentFit="contain" nativeControls />
          ) : (
            <Image
              source={{ uri: preview.uri }}
              style={{ flex: 1 }}
              contentFit="contain"
              transition={150}
              cachePolicy="memory-disk"
            />
          )}

          {(loading || preview.needsDownload) && (
            <Overlay>
              <ActivityIndicator color={t.colors.text} />
              <T variant="heading" style={{ marginTop: t.spacing.md }}>
                {preview.needsDownload ? labels.downloadingTitle : labels.loading}
              </T>
              {preview.needsDownload ? (
                <T variant="body" tone="dim" style={{ textAlign: 'center', marginTop: 4 }}>
                  {labels.downloadingBody}
                </T>
              ) : null}
            </Overlay>
          )}
        </>
      ) : error ? (
        <Overlay>
          <Ionicons name="image-outline" size={40} color={t.colors.textFaint} />
          <T variant="heading" style={{ marginTop: t.spacing.md }}>
            {labels.unavailableTitle}
          </T>
          <T variant="body" tone="dim" style={{ textAlign: 'center', marginTop: 4 }}>
            {labels.unavailableBody}
          </T>
        </Overlay>
      ) : (
        <Overlay>
          <ActivityIndicator color={t.colors.text} />
          <T variant="body" tone="dim" style={{ marginTop: t.spacing.md }}>
            {labels.loading}
          </T>
        </Overlay>
      )}
    </View>
  );
}

const absFill = { position: 'absolute' as const, left: 0, right: 0, top: 0, bottom: 0 };

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        ...absFill,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      {children}
    </View>
  );
}
