/**
 * Serializable, device-local view of a Photos asset.
 *
 * This is the ONLY shape the rest of the app works with. The expo-media-library
 * `Asset` class handles (live native references) never leave src/media: they are
 * not serialisable and go stale across app launches. We persist and reason about
 * `MediaItem`, and re-resolve a live handle by `id` only when we need a preview
 * URI or a deletion. `id` is the iOS PHAsset localIdentifier — a *device-local*
 * reference, never a cross-device key, so it is never uploaded anywhere.
 */
export type MediaKind = 'photo' | 'video';

export interface MediaItem {
  /** Device-local asset id (PHAsset localIdentifier on iOS). Stable on this device only. */
  id: string;
  kind: MediaKind;
  /** Capture/creation time in ms since epoch, or null when the library has no date. */
  creationTime: number | null;
  /** Last-modification time in ms since epoch, used to detect the asset changed under us. */
  modificationTime: number | null;
  /** Video length in seconds. null for photos (and for videos whose duration is unknown). */
  durationSec: number | null;
  width: number;
  height: number;
  /** Marked as a Favorite in Photos. Protected from deletion unless the user opts in. */
  isFavorite: boolean;
}

/** A resolved, displayable reference to one asset. Short-lived; fetched per card. */
export interface MediaPreview {
  id: string;
  kind: MediaKind;
  /** file:// or ph:// URI usable by expo-image / expo-video. */
  uri: string;
  width: number;
  height: number;
  durationSec: number | null;
  /** The asset is iCloud-only and the original is not on device yet. */
  needsDownload: boolean;
  /** Temporary: what getUri() returned (videos), for on-device diagnosis. */
  debugUri?: string;
}

/** iOS Photos authorization state, normalised across the media adapter. */
export type MediaAccess = 'all' | 'limited' | 'none' | 'undetermined';
