import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import type { MediaPreview } from '../../media/types';
import { useTheme } from '../theme';
import { T } from './Text';

export interface MediaCardLabels {
  loading: string;
  unavailableTitle: string;
  unavailableBody: string;
}

/**
 * One full-bleed media card. Photos are shown uncropped over a dimmed cover of
 * the same image. Videos load from the PHAsset ph:// identifier via replaceAsync
 * (the only path that works for iOS Photos) and use native controls.
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
  // The adapter already provides the correct playable source (ph:// on iOS,
  // the mock URL on web).
  const videoSource = isVideo ? preview?.uri ?? null : null;

  const [imgLoading, setImgLoading] = useState(true);
  const [vLoading, setVLoading] = useState(true);

  // Reset loading state whenever the shown asset changes.
  useEffect(() => {
    setImgLoading(true);
    setVLoading(true);
  }, [preview?.id]);

  const player = useVideoPlayer(null, (p) => {
    p.loop = true;
    p.muted = true;
  });

  // Capture video status / errors (drives the spinner + the debug line).
  useEffect(() => {
    if (!player) return;
    const sub = player.addListener('statusChange', (payload: { status?: string }) => {
      const status = payload?.status ?? '?';
      setVLoading(status === 'loading' || status === 'idle');
    });
    return () => sub.remove();
  }, [player]);

  // Load the current video asynchronously (ph:// requires replaceAsync).
  useEffect(() => {
    if (!player || !videoSource) return;
    let cancelled = false;
    void (async () => {
      try {
        await player.replaceAsync(videoSource);
        if (!cancelled && active) player.play();
      } catch {
        /* asset unavailable / player released */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [player, videoSource, active]);

  // Play only while this card is the active one.
  useEffect(() => {
    if (!player) return;
    try {
      if (active && isVideo) player.play();
      else player.pause();
    } catch {
      /* player may have been released */
    }
  }, [player, active, isVideo]);

  const showSpinner = loading || (isVideo ? vLoading : imgLoading);

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
          {preview.kind === 'photo' ? (
            <Image source={{ uri: preview.uri }} style={{ ...absFill }} contentFit="cover" transition={120} cachePolicy="memory-disk" />
          ) : null}
          <View style={{ ...absFill, backgroundColor: t.colors.scrim }} />

          {isVideo ? (
            <VideoView player={player} style={{ flex: 1 }} contentFit="contain" nativeControls />
          ) : (
            <Image
              source={{ uri: preview.uri }}
              style={{ flex: 1 }}
              contentFit="contain"
              transition={150}
              cachePolicy="memory-disk"
              onLoadStart={() => setImgLoading(true)}
              onLoad={() => setImgLoading(false)}
              onError={() => setImgLoading(false)}
            />
          )}

          {showSpinner && (
            <Overlay>
              <ActivityIndicator color={t.colors.text} />
              <T variant="body" tone="dim" style={{ marginTop: t.spacing.md }}>
                {labels.loading}
              </T>
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
  return <View style={{ ...absFill, alignItems: 'center', justifyContent: 'center', padding: 24 }}>{children}</View>;
}
