import { useEffect, useState } from 'react';
import type { MediaItem } from '../media/types';
import { media } from '../state/instances';

/**
 * Display URIs for small prints (hero stack, chapter covers). On device the
 * asset id is already a ph:// URI that expo-image renders at thumbnail size, so
 * this is a pure mapping with no native work. Only the web mock needs to
 * resolve real URLs.
 */
export function useThumbs(items: MediaItem[], max = 3): Record<string, string> {
  const [resolved, setResolved] = useState<Record<string, string>>({});
  const key = items
    .slice(0, max)
    .map((i) => i.id)
    .join('|');

  useEffect(() => {
    if (!media.isMock) return;
    let cancelled = false;
    const targets = items.slice(0, max).filter((i) => !resolved[i.id]);
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
      setResolved((prev) => {
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

  if (media.isMock) return resolved;
  const out: Record<string, string> = {};
  for (const i of items.slice(0, max)) out[i.id] = i.id.startsWith('ph://') ? i.id : `ph://${i.id}`;
  return out;
}
