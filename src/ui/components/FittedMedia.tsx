import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import type { MediaPreview } from '../../media/types';
import { useTheme } from '../theme';
import { T } from './Text';

export interface FittedMediaLabels {
  loading: string;
  errorTitle: string;
  errorBody: string;
}

/**
 * The photo or video being decided on, always aspect-fit (never cropped) on a
 * neutral background. Videos load from the ph:// id via replaceAsync (the only
 * path that works for iOS Photos), start muted with native controls, and pause
 * whenever the card is not the active one. Audio never autoplays.
 */
export function FittedMedia({
  preview,
  loading,
  error,
  active,
  labels,
  radius = 4,
}: {
  preview: MediaPreview | null;
  loading: boolean;
  error: boolean;
  active: boolean;
  labels: FittedMediaLabels;
  radius?: number;
}) {
  const t = useTheme();
  const isVideo = preview?.kind === 'video';
  const videoSource = isVideo ? preview?.uri ?? null : null;

  const [imgLoading, setImgLoading] = useState(true);
  const [vLoading, setVLoading] = useState(true);

  useEffect(() => {
    setImgLoading(true);
    setVLoading(true);
  }, [preview?.id]);

  const player = useVideoPlayer(null, (p) => {
    p.loop = true;
    p.muted = true;
  });

  useEffect(() => {
    if (!player) return;
    const sub = player.addListener('statusChange', (payload: { status?: string }) => {
      const status = payload?.status ?? '?';
      setVLoading(status === 'loading' || status === 'idle');
    });
    return () => sub.remove();
  }, [player]);

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

  // Pause whenever inactive; only resume once the source is actually ready
  // (replaceAsync starts playback itself when the load completes).
  useEffect(() => {
    if (!player) return;
    try {
      if (active && isVideo) {
        if (player.status === 'readyToPlay') player.play();
      } else {
        player.pause();
      }
    } catch {
      /* player may have been released */
    }
  }, [player, active, isVideo]);

  const showSpinner = loading || (preview ? (isVideo ? vLoading : imgLoading) : true);

  return (
    <View style={{ flex: 1, borderRadius: radius, overflow: 'hidden', backgroundColor: t.colors.imageBg }}>
      {preview && !error ? (
        isVideo ? (
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
            accessibilityIgnoresInvertColors
          />
        )
      ) : null}

      {error ? (
        <Overlay>
          <Ionicons name="image-outline" size={36} color={t.colors.secondary} />
          <T variant="heading" style={{ marginTop: 12, textAlign: 'center' }}>
            {labels.errorTitle}
          </T>
          <T variant="meta" tone="secondary" style={{ textAlign: 'center', marginTop: 4 }}>
            {labels.errorBody}
          </T>
        </Overlay>
      ) : showSpinner ? (
        <Overlay>
          <ActivityIndicator color={t.colors.secondary} />
          <T variant="meta" tone="secondary" style={{ marginTop: 10 }} accessibilityLiveRegion="polite">
            {labels.loading}
          </T>
        </Overlay>
      ) : null}
    </View>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {children}
    </View>
  );
}
