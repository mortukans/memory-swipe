import { useEffect, useState } from 'react';
import type { MediaItem } from '../media/types';
import { media } from '../state/instances';

/**
 * Resolve display URIs for a small set of photo items (hero prints, chapter
 * thumbnails). Cached per id for the component's life; failures stay blank
 * (a quiet paper placeholder). Pass photos — video URIs are not renderable
 * as still images.
 */
export function useThumbs(items: MediaItem[], max = 3): Record<string, string> {
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const key = items
    .slice(0, max)
    .map((i) => i.id)
    .join('|');

  useEffect(() => {
    let cancelled = false;
    const targets = items.slice(0, max).filter((i) => !thumbs[i.id]);
    if (targets.length === 0) return;
    void Promise.all(
      targets.map(async (i) => {
        try {
          const p = await media.resolvePreview(i);
          return [i.id, p.uri] as const;
        } catch {
          return null;
        }
      }),
    ).then((res) => {
      if (cancelled) return;
      setThumbs((prev) => {
        const next = { ...prev };
        for (const r of res) if (r) next[r[0]] = r[1];
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return thumbs;
}
