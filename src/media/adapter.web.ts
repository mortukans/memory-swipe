import type { MediaItem, MediaPreview } from './types';
import type { AlbumRef, MediaAdapter, QueryOpts } from './MediaAdapter';

/**
 * Web mock adapter. `expo start --web` has no Photos library, so this serves a
 * deterministic set of sample items (seeded placeholder images + a couple of
 * sample videos) purely so the UI can be built and smoke-tested in a browser.
 * It never deletes anything real.
 */

const SAMPLE_VIDEO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

function buildSamples(): MediaItem[] {
  const items: MediaItem[] = [];
  const now = Date.now();
  const monthMs = 30 * 24 * 3600 * 1000;
  for (let i = 0; i < 36; i++) {
    const isVideo = i % 7 === 3; // a few videos sprinkled in
    items.push({
      id: `mock-${i}`,
      kind: isVideo ? 'video' : 'photo',
      creationTime: i === 35 ? null : now - Math.floor(i / 6) * monthMs - i * 3600_000,
      modificationTime: now,
      durationSec: isVideo ? (i % 2 === 0 ? 12 : 48) : null,
      width: 1200,
      height: 1600,
      isFavorite: i % 11 === 0,
    });
  }
  return items;
}

let SAMPLES = buildSamples();

function page(items: MediaItem[], opts?: QueryOpts): MediaItem[] {
  let out = items;
  if (opts?.kind) out = out.filter((i) => i.kind === opts.kind);
  out = out
    .slice()
    .sort((a, b) => (b.creationTime ?? 0) - (a.creationTime ?? 0));
  if (opts?.offset != null) out = out.slice(opts.offset);
  if (opts?.limit != null) out = out.slice(0, opts.limit);
  return out;
}

export const adapter: MediaAdapter = {
  isMock: true,
  async getAccess() {
    return 'all';
  },
  async requestAccess() {
    return 'all';
  },
  async presentLimitedPicker() {},
  async query(opts) {
    return page(SAMPLES, opts);
  },
  async queryAlbum(_albumId, opts) {
    return page(SAMPLES, opts);
  },
  async listAlbums(): Promise<AlbumRef[]> {
    return [
      { id: 'album-recents', title: 'Recents' },
      { id: 'album-screenshots', title: 'Screenshots' },
    ];
  },
  async resolvePreview(item): Promise<MediaPreview> {
    const uri =
      item.kind === 'video' ? SAMPLE_VIDEO : `https://picsum.photos/seed/${item.id}/900/1200`;
    return {
      id: item.id,
      kind: item.kind,
      uri,
      width: item.width,
      height: item.height,
      durationSec: item.durationSec,
      needsDownload: false,
    };
  },
  async deleteAssets(ids) {
    const gone = new Set(ids);
    SAMPLES = SAMPLES.filter((i) => !gone.has(i.id));
  },
  async existing(ids) {
    const live = new Set(SAMPLES.map((i) => i.id));
    return new Set(ids.filter((id) => live.has(id)));
  },
  subscribe() {
    return () => {};
  },
};

export default adapter;
