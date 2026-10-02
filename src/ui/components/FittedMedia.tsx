import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView, type StatusChangeEventPayload } from 'expo-video';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import type { MediaPreview } from '../../media/types';
import { useTheme } from '../theme';
import { PrimaryButton } from './PrimaryButton';
import { T } from './Text';

export interface FittedMediaLabels {
  loading: string;
  errorTitle: string;
  errorBody: string;
  retry: string;
}

/**
 * The photo or video being decided on, always aspect-fit (never cropped) on a
 * neutral background. Both load from the ph:// id: expo-image fetches a
 * viewport-sized rendition; expo-video loads via replaceAsync (the only path
 * that works for iOS Photos). Videos start muted with native controls and pause
 * whenever the card is not active. Audio never autoplays. Load failures offer
 * Retry (the user can always Skip).
 */
export function FittedMedia({
  preview,
  loading,
  error,
  active,
  labels,
  onRetry,
  radius = 4,
}: {
  preview: MediaPreview | null;
  loading: boolean;
  error: boolean;
  active: boolean;
  labels: FittedMediaLabels;
  onRetry?: () => void;
  radius?: number;
}) {
  const t = useTheme();
  const isVideo = preview?.kind === 'video';
  const videoSource = isVideo ? preview?.uri ?? null : null;

  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [vLoading, setVLoading] = useState(true);

  useEffect(() => {
    setImgLoading(true);
    setImgError(false);
    setVLoading(true);
  }, [preview?.id]);

  const player = useVideoPlayer(null, (p) => {
    p.loop = true;
    p.muted = true;
  });

  useEffect(() => {
    if (!player) return;
    const sub = player.addListener('statusChange', (payload: StatusChangeEventPayload) => {
      setVLoading(payload.status === 'loading' || payload.status === 'idle');
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

  // Pause whenever inactive; only resume once the source is actually ready.
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

  const failed = error || imgError;
  const showSpinner = !failed && (loading || (preview ? (isVideo ? vLoading : imgLoading) : true));

  return (
    <View style={{ flex: 1, borderRadius: radius, overflow: 'hidden', backgroundColor: t.colors.imageBg }} accessibilityIgnoresInvertColors>
      {preview && !failed ? (
        isVideo ? (
          <VideoView player={player} style={{ flex: 1 }} contentFit="contain" nativeControls />
        ) : (
          <Image
            source={{ uri: preview.uri }}
            style={{ flex: 1 }}
            contentFit="contain"
            transition={150}
            cachePolicy="memory"
            recyclingKey={preview.id}
            onLoadStart={() => setImgLoading(true)}
            onLoad={() => setImgLoading(false)}
            onError={() => {
              setImgLoading(false);
              setImgError(true);
            }}
          />
        )
      ) : null}

      {failed ? (
        <Overlay>
          <Ionicons name="image-outline" size={36} color={t.colors.secondary} />
          <T variant="heading" style={{ marginTop: 12, textAlign: 'center' }}>
            {labels.errorTitle}
          </T>
          <T variant="meta" tone="secondary" style={{ textAlign: 'center', marginTop: 4 }}>
            {labels.errorBody}
          </T>
          {onRetry ? <PrimaryButton label={labels.retry} variant="ghost" arrow={false} fullWidth={false} onPress={onRetry} style={{ marginTop: 12 }} /> : null}
        </Overlay>
      ) : showSpinner ? (
        <Overlay>
          <ActivityIndicator color={t.colors.secondary} />
          <T variant="meta" tone="secondary" style={{ marginTop: 10 }}>
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
