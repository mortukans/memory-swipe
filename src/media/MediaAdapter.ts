import type { AssetMetadata } from 'expo-media-library';
import type { MediaAccess, MediaItem, MediaKind, MediaPreview } from './types';

/**
 * The single seam between the app and the device Photos library.
 *
 * Two implementations exist (Metro picks by platform):
 *   - adapter.ts      → real expo-media-library class API (iOS / Android)
 *   - adapter.web.ts  → in-memory mock with sample items, for `expo start --web`
 *
 * Everything above this interface works with serialisable MediaItem / MediaPreview
 * and plain ids, never the live native Asset handles.
 */
export interface AlbumRef {
  id: string;
  title: string;
}

export interface QueryOpts {
  /** Restrict to one media kind. Omit for both photos and videos. */
  kind?: MediaKind;
  /** Page size for incremental indexing. Omit to fetch all matching metadata. */
  limit?: number;
  offset?: number;
}

export interface MediaAdapter {
  /** True on the web mock, so the UI can show a "sample data" note and hide delete. */
  readonly isMock: boolean;

  getAccess(): Promise<MediaAccess>;
  requestAccess(): Promise<MediaAccess>;
  /** iOS limited-access: let the user change which photos the app can see. */
  presentLimitedPicker(): Promise<void>;

  /** Cheap metadata query across the whole library (optionally one kind / one page). */
  query(opts?: QueryOpts): Promise<MediaItem[]>;
  /** Cheap metadata query within one album. */
  queryAlbum(albumId: string, opts?: QueryOpts): Promise<MediaItem[]>;
  listAlbums(): Promise<AlbumRef[]>;

  /** Resolve a displayable URI for one asset, just before showing its card. */
  resolvePreview(item: MediaItem): Promise<MediaPreview>;

  /**
   * Delete assets by id. On iOS this always triggers the system's own deletion
   * confirmation; it rejects if the user cancels. Deleted items go to Recently
   * Deleted for ~30 days — we never claim otherwise.
   */
  deleteAssets(ids: string[]): Promise<void>;

  /** Of these ids, which still exist in the library (for pre-deletion revalidation). */
  existing(ids: string[]): Promise<Set<string>>;

  /** Subscribe to library changes (iOS permission/selection changes, external edits). */
  subscribe(onChange: () => void): () => void;
}

// ─── shared pure mapper (no native import, safe on web) ──────────────────────

/** Map one cheap AssetMetadata row to our serialisable MediaItem, or null to skip. */
export function metadataToItem(m: AssetMetadata): MediaItem | null {
  // MediaType enum values are the string literals 'image' | 'video' | ... so we
  // compare strings and never import the native enum into shared code.
  const kind: MediaKind | null =
    m.mediaType === 'image' ? 'photo' : m.mediaType === 'video' ? 'video' : null;
  if (!kind) return null; // audio / unknown are out of scope
  return {
    id: m.id,
    kind,
    creationTime: m.creationTime,
    modificationTime: m.modificationTime,
    // SDK 57 reports duration in milliseconds; we store seconds everywhere else.
    durationSec: kind === 'video' && m.duration != null ? m.duration / 1000 : null,
    width: m.width ?? 0,
    height: m.height ?? 0,
    isFavorite: m.isFavorite,
  };
}
