import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { applyFavoriteProtection, groupByMonth, type CollectionKind, type MonthBucket } from '../../src/collections';
import type { AlbumRef, MediaItem } from '../../src/media';
import { media } from '../../src/state/instances';
import { useLibrary } from '../../src/state/library';
import { applyFilter, type MediaFilter } from '../../src/state/session';
import { useSettings } from '../../src/state/settings';
import { Callout } from '../../src/ui/components/Callout';
import { Chip } from '../../src/ui/components/Chip';
import { MonthRow } from '../../src/ui/components/MonthRow';
import { PrimaryButton } from '../../src/ui/components/PrimaryButton';
import { Screen } from '../../src/ui/components/Screen';
import { T } from '../../src/ui/components/Text';
import { monthLabel, monthName } from '../../src/ui/format';
import { useTheme } from '../../src/ui/theme';
import { useThumbs } from '../../src/ui/useThumbs';

type Filter = 'all' | 'photo' | 'video' | 'short' | 'long' | 'albums';

/** Library: media filters, then monthly chapters grouped by year, or albums. */
export default function Library() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const items = useLibrary((s) => s.items);
  const reviewedIds = useLibrary((s) => s.reviewedIds);
  const access = useLibrary((s) => s.access);
  const refresh = useLibrary((s) => s.refresh);
  const includeFavorites = useSettings((s) => s.settings.includeFavorites);
  const shortMax = useSettings((s) => s.settings.shortVideoMaxSec);
  const [filter, setFilter] = useState<Filter>('all');
  const [albums, setAlbums] = useState<AlbumRef[]>([]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useEffect(() => {
    if (filter === 'albums' && (access === 'all' || access === 'limited')) {
      media.listAlbums().then(setAlbums).catch(() => setAlbums([]));
    }
  }, [filter, access]);

  const mediaFilter: MediaFilter | null = filter === 'all' || filter === 'albums' ? null : filter;
  const scoped = useMemo(() => {
    const base = applyFavoriteProtection(items, includeFavorites);
    return mediaFilter ? applyFilter(base, mediaFilter, shortMax) : base;
  }, [items, includeFavorites, mediaFilter, shortMax]);
  const months = useMemo(() => groupByMonth(scoped), [scoped]);
  const byYear = useMemo(() => {
    const m = new Map<string, MonthBucket[]>();
    for (const b of months) {
      const y = b.year == null ? '' : String(b.year);
      m.set(y, [...(m.get(y) ?? []), b]);
    }
    return [...m.entries()];
  }, [months]);
  const coverItems = useMemo(
    () => months.map((b) => b.items.find((i) => i.kind === 'photo')).filter((i): i is MediaItem => Boolean(i)),
    [months],
  );
  const thumbs = useThumbs(coverItems, 36);
  const unreviewedCount = useMemo(() => scoped.filter((i) => !reviewedIds.has(i.id)).length, [scoped, reviewedIds]);

  const chips: [Filter, string][] = [
    ['all', t('filter.all')],
    ['photo', t('filter.photos')],
    ['video', t('filter.videos')],
    ['short', t('filter.short')],
    ['long', t('filter.long')],
    ['albums', t('filter.albums')],
  ];
  const scopeLabel = chips.find(([f]) => f === filter)?.[1] ?? '';

  const goScope = () => {
    const kind: CollectionKind =
      filter === 'photo' ? 'photos' : filter === 'video' ? 'videos' : filter === 'short' ? 'short-videos' : filter === 'long' ? 'long-videos' : 'random';
    router.push({ pathname: '/swipe', params: { kind, key: '', title: scopeLabel } });
  };
  const goMonth = (b: MonthBucket) =>
    router.push({
      pathname: '/swipe',
      params: {
        kind: 'month',
        key: b.key,
        filter: mediaFilter ?? '',
        title: b.year == null ? t('library.unknownMonth') : monthLabel(i18n.language, b.year, b.month!),
      },
    });
  const goAlbum = (a: AlbumRef) => router.push({ pathname: '/swipe', params: { kind: 'album', key: a.id, title: a.title, filter: '' } });

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: theme.spacing.page, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <T variant="eyebrow" tone="secondary" style={{ textAlign: 'center', paddingVertical: 18 }}>
          {t('library.eyebrow')}
        </T>
        <T variant="title">{t('library.title')}</T>
        <T variant="body" tone="secondary" style={{ marginTop: 10 }}>
          {t('library.body')}
        </T>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 18 }}>
          {chips.map(([f, label]) => (
            <Chip key={f} label={label} selected={filter === f} onPress={() => setFilter(f)} />
          ))}
        </View>

        {filter !== 'albums' ? (
          <>
            <PrimaryButton label={t('library.startScope', { scope: scopeLabel })} onPress={goScope} disabled={unreviewedCount === 0} />
            <T variant="meta" tone="secondary" style={{ textAlign: 'center', fontSize: 11, marginTop: 10, marginBottom: 6 }}>
              {unreviewedCount === 0 ? t('empty.scope') : t('library.memories', { count: unreviewedCount })}
            </T>
            {byYear.map(([year, buckets]) => (
              <View key={year || 'unknown'} style={{ marginTop: 16 }}>
                <T variant="eyebrow" tone="secondary" style={{ marginBottom: 4 }}>
                  {year ? t('library.chapters', { year }) : t('library.unknownMonth')}
                </T>
                {buckets.map((b) => {
                  const cover = b.items.find((i) => i.kind === 'photo');
                  const reviewed = b.items.filter((i) => reviewedIds.has(i.id)).length;
                  return (
                    <MonthRow
                      key={b.key}
                      title={b.year == null ? t('library.unknownMonth') : monthName(i18n.language, b.month!)}
                      sub={t('library.memories', { count: b.items.length })}
                      uri={cover ? thumbs[cover.id] : null}
                      fraction={b.items.length ? reviewed / b.items.length : 0}
                      onPress={() => goMonth(b)}
                    />
                  );
                })}
              </View>
            ))}
            {months.length === 0 ? <Callout title={t('empty.library')}>{t('empty.libraryBody')}</Callout> : null}
          </>
        ) : (
          <>
            {albums.map((a) => (
              <MonthRow key={a.id} title={a.title} sub={t('filter.albums')} uri={null} fraction={0} onPress={() => goAlbum(a)} />
            ))}
            {albums.length === 0 ? <Callout title={t('empty.library')}>{t('empty.libraryBody')}</Callout> : null}
          </>
        )}

        <T variant="meta" tone="secondary" style={{ textAlign: 'center', marginTop: 28, fontSize: 11 }}>
          {t('library.resume')}
        </T>
      </ScrollView>
    </Screen>
  );
}
