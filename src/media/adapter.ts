import {
  Album,
  Asset,
  AssetField,
  MediaType,
  Query,
  addListener,
  getPermissionsAsync,
  presentPermissionsPicker,
  requestPermissionsAsync,
} from 'expo-media-library';
import type { PermissionResponse } from 'expo-media-library';
import type { MediaAccess, MediaItem, MediaPreview } from './types';
import { metadataToItem, type AlbumRef, type MediaAdapter, type QueryOpts } from './MediaAdapter';

/**
 * Native Photos adapter (iOS / Android), built on the SDK 57 class-based
 * MediaLibrary API: `new Query()…exeForMetadata()` for the cheap index,
 * `new Asset(id)` to re-resolve a stored id into a live handle for preview and
 * deletion. See src/media/MediaAdapter.ts for the contract.
 */

function normalizeAccess(r: PermissionResponse): MediaAccess {
  if (r.accessPrivileges === 'all') return 'all';
  if (r.accessPrivileges === 'limited') return 'limited';
  if (r.status === 'undetermined' && r.canAskAgain) return 'undetermined';
  return 'none';
}

function baseQuery(opts?: QueryOpts): Query {
  let q = new Query().orderBy({ key: AssetField.CREATION_TIME, ascending: false });
  if (opts?.kind === 'photo') q = q.eq(AssetField.MEDIA_TYPE, MediaType.IMAGE);
  else if (opts?.kind === 'video') q = q.eq(AssetField.MEDIA_TYPE, MediaType.VIDEO);
  else q = q.within(AssetField.MEDIA_TYPE, [MediaType.IMAGE, MediaType.VIDEO]);
  if (opts?.limit != null) q = q.limit(opts.limit);
  if (opts?.offset != null) q = q.offset(opts.offset);
  return q;
}

async function runMetadata(q: Query): Promise<MediaItem[]> {
  const metas = await q.exeForMetadata();
  const items: MediaItem[] = [];
  for (const m of metas) {
    const it = metadataToItem(m);
    if (it) items.push(it);
  }
  return items;
}

export const adapter: MediaAdapter = {
  isMock: false,

  async getAccess() {
    return normalizeAccess(await getPermissionsAsync());
  },
  async requestAccess() {
    return normalizeAccess(await requestPermissionsAsync());
  },
  async presentLimitedPicker() {
    try {
      await presentPermissionsPicker();
    } catch {
      // No-op when the user has full (not limited) access, or on platforms without it.
    }
  },

  async query(opts) {
    return runMetadata(baseQuery(opts));
  },
  async queryAlbum(albumId, opts) {
    return runMetadata(baseQuery(opts).album(new Album(albumId)));
  },
  async listAlbums() {
    const albums = await Album.getAll();
    const refs = await Promise.all(
      albums.map(async (a): Promise<AlbumRef> => {
        let title = '';
        try {
          title = await a.getTitle();
        } catch {
          title = '';
        }
        return { id: a.id, title };
      }),
    );
    return refs.filter((r) => r.title.length > 0);
  },

  async resolvePreview(item): Promise<MediaPreview> {
    const a = new Asset(item.id);
    // Run both native calls concurrently so a card resolves in one round-trip,
    // not two. getIsInCloud is iOS-only and may reject elsewhere.
    const [uri, needsDownload] = await Promise.all([
      a.getUri(),
      a.getIsInCloud().catch(() => false),
    ]);
    return {
      id: item.id,
      kind: item.kind,
      uri,
      width: item.width,
      height: item.height,
      durationSec: item.durationSec,
      needsDownload,
    };
  },

  async deleteAssets(ids) {
    if (ids.length === 0) return;
    // iOS presents its own confirmation here and rejects on cancel.
    await Asset.delete(ids.map((id) => new Asset(id)));
  },

  async existing(ids) {
    const out = new Set<string>();
    await Promise.all(
      ids.map(async (id) => {
        try {
          // Cheapest getter that throws when the asset is gone.
          await new Asset(id).getMediaType();
          out.add(id);
        } catch {
          // asset no longer in the library
        }
      }),
    );
    return out;
  },

  subscribe(onChange) {
    const sub = addListener(() => onChange());
    return () => sub.remove();
  },
};

export default adapter;
