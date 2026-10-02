import { Ionicons } from '@expo/vector-icons';
import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  applyFavoriteProtection,
  groupByMonth,
  longVideos,
  onlyKind,
  shortVideos,
  type CollectionKind,
} from '../src/collections';
import type { AlbumRef } from '../src/media';
import { media } from '../src/state/instances';
import { useLibrary } from '../src/state/library';
import { useQueue } from '../src/state/queue';
import { useSettings } from '../src/state/settings';
import { Button } from '../src/ui/components/Button';
import { CollectionTile } from '../src/ui/components/CollectionTile';
import { Screen } from '../src/ui/components/Screen';
import { T } from '../src/ui/components/Text';
import { useTheme } from '../src/ui/theme';

const MONTH_NAMES_KEY = 'month';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const onboarded = useSettings((s) => s.settings.onboarded);
  const includeFavorites = useSettings((s) => s.settings.includeFavorites);
  const shortMax = useSettings((s) => s.settings.shortVideoMaxSec);
  const access = useLibrary((s) => s.access);
  const items = useLibrary((s) => s.items);
  const reviewedIds = useLibrary((s) => s.reviewedIds);
  const loading = useLibrary((s) => s.loading);
  const refresh = useLibrary((s) => s.refresh);
  const requestAccess = useLibrary((s) => s.requestAccess);
  const queueIds = useQueue((s) => s.ids);
  const loadQueue = useQueue((s) => s.load);
  const [albums, setAlbums] = useState<AlbumRef[]>([]);

  // First run → onboarding.
  useEffect(() => {
    if (!onboarded) router.replace('/onboarding');
  }, [onboarded]);

  useFocusEffect(
    useCallback(() => {
      if (onboarded) {
        void refresh();
        void loadQueue();
      }
    }, [onboarded, refresh, loadQueue]),
  );

  useEffect(() => {
    if (access === 'all' || access === 'limited') {
      media.listAlbums().then(setAlbums).catch(() => setAlbums([]));
    }
  }, [access, items.length]);

  const reviewable = useMemo(
    () => applyFavoriteProtection(items, includeFavorites),
    [items, includeFavorites],
  );
  const remainingOf = useCallback(
    (list: typeof items) => applyFavoriteProtection(list, includeFavorites).filter((i) => !reviewedIds.has(i.id)).length,
    [includeFavorites, reviewedIds],
  );
  const totalOf = useCallback(
    (list: typeof items) => applyFavoriteProtection(list, includeFavorites).length,
    [includeFavorites],
  );

  const months = useMemo(() => groupByMonth(reviewable), [reviewable]);
  const monthLabel = useCallback(
    (year: number | null, month: number | null) => {
      if (year == null || month == null) return t('home.collections.unknownMonth');
      const d = new Date(year, month - 1, 1);
      return new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(d);
    },
    [i18n.language, t],
  );

  // One memoised pass for the Browse counts (the library can hold thousands of items).
  const browse = useMemo(() => {
    const stat = (list: typeof items) => {
      const r = applyFavoriteProtection(list, includeFavorites);
      return { total: r.length, remaining: r.filter((i) => !reviewedIds.has(i.id)).length };
    };
    return {
      photos: stat(onlyKind(items, 'photo')),
      videos: stat(onlyKind(items, 'video')),
      shorts: stat(shortVideos(items, shortMax)),
      longs: stat(longVideos(items, shortMax)),
    };
  }, [items, shortMax, includeFavorites, reviewedIds]);

  const go = (kind: CollectionKind, key = '', title = '') =>
    router.push({ pathname: '/swipe', params: { kind, key, title } });

  if (access !== 'all' && access !== 'limited') {
    return (
      <Screen>
        <Header title={t('app.name')} />
        <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing.lg }}>
          <Ionicons name="images-outline" size={48} color={theme.colors.accent} />
          <T variant="title">{t('permission.title')}</T>
          <T variant="body" tone="dim">
            {t('permission.body')}
          </T>
          <Button label={t('permission.allow')} icon="lock-open-outline" onPress={() => void requestAccess()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: theme.spacing.lg }}>
        <Header title={t('app.name')} />
      </View>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl, gap: theme.spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        <T variant="body" tone="dim">
          {t('home.greeting')}
        </T>

        {queueIds.length > 0 ? (
          <Pressable onPress={() => router.push('/review')} accessibilityRole="button">
            <View
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: theme.colors.remove,
                padding: theme.spacing.lg,
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.md,
              }}
            >
              <Ionicons name="trash-outline" size={22} color={theme.colors.remove} />
              <View style={{ flex: 1 }}>
                <T variant="label">{t('home.reviewQueue')}</T>
                <T variant="caption" tone="dim">
                  {t('home.reviewQueueCount', { count: queueIds.length })}
                </T>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textFaint} />
            </View>
          </Pressable>
        ) : null}

        <Section title={t('home.sections.quick')}>
          <CollectionTile
            title={t('home.collections.random')}
            subtitle={t('home.collections.randomSub')}
            icon="shuffle"
            remaining={remainingOf(reviewable)}
            total={totalOf(reviewable)}
            accent
            onPress={() => go('random', '', t('home.collections.random'))}
          />
        </Section>

        <Section title={t('home.sections.browse')}>
          <CollectionTile title={t('home.collections.photos')} icon="image-outline" remaining={browse.photos.remaining} total={browse.photos.total} onPress={() => go('photos', '', t('home.collections.photos'))} />
          <CollectionTile title={t('home.collections.videos')} icon="videocam-outline" remaining={browse.videos.remaining} total={browse.videos.total} onPress={() => go('videos', '', t('home.collections.videos'))} />
          <CollectionTile title={t('home.collections.shortVideos')} icon="timer-outline" remaining={browse.shorts.remaining} total={browse.shorts.total} onPress={() => go('short-videos', '', t('home.collections.shortVideos'))} />
          <CollectionTile title={t('home.collections.longVideos')} icon="film-outline" remaining={browse.longs.remaining} total={browse.longs.total} onPress={() => go('long-videos', '', t('home.collections.longVideos'))} />
        </Section>

        {months.length > 0 ? (
          <Section title={t('home.sections.months')}>
            {months.map((m) => {
              const label = monthLabel(m.year, m.month);
              return (
                <CollectionTile
                  key={m.key}
                  title={label}
                  icon="calendar-outline"
                  remaining={m.items.filter((i) => !reviewedIds.has(i.id)).length}
                  total={m.items.length}
                  onPress={() => go(MONTH_NAMES_KEY as CollectionKind, m.key, label)}
                />
              );
            })}
          </Section>
        ) : null}

        {albums.length > 0 ? (
          <Section title={t('home.sections.albums')}>
            {albums.map((a) => (
              <CollectionTile key={a.id} title={a.title} icon="albums-outline" remaining={0} total={0} onPress={() => go('album', a.id, a.title)} />
            ))}
          </Section>
        ) : null}

        {loading && items.length === 0 ? (
          <T variant="body" tone="dim" style={{ textAlign: 'center' }}>
            {t('common.loading')}
          </T>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Header({ title }: { title: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: theme.spacing.md }}>
      <T variant="display">{title}</T>
      <Link href="/settings" asChild>
        <Pressable accessibilityRole="button" accessibilityLabel="Settings" hitSlop={10}>
          <Ionicons name="settings-outline" size={24} color={theme.colors.textDim} />
        </Pressable>
      </Link>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <T variant="label" tone="faint" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {title}
      </T>
      <View style={{ gap: theme.spacing.sm }}>{children}</View>
    </View>
  );
}
