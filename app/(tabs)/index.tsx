import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { SESSION_SIZE, applyFavoriteProtection, onlyKind, type CollectionKind } from '../../src/collections';
import { useLibrary } from '../../src/state/library';
import { useQueue } from '../../src/state/queue';
import { useSettings } from '../../src/state/settings';
import { Callout } from '../../src/ui/components/Callout';
import { PrimaryButton } from '../../src/ui/components/PrimaryButton';
import { PrintStack } from '../../src/ui/components/PrintStack';
import { Screen } from '../../src/ui/components/Screen';
import { T } from '../../src/ui/components/Text';
import { Tile } from '../../src/ui/components/Tile';
import { useTheme } from '../../src/ui/theme';
import { useThumbs } from '../../src/ui/useThumbs';

/** Discover: the editorial front page. Hero prints are your own recent photos. */
export default function Discover() {
  const { t } = useTranslation();
  const theme = useTheme();
  const access = useLibrary((s) => s.access);
  const items = useLibrary((s) => s.items);
  const reviewedIds = useLibrary((s) => s.reviewedIds);
  const loading = useLibrary((s) => s.loading);
  const refresh = useLibrary((s) => s.refresh);
  const requestAccess = useLibrary((s) => s.requestAccess);
  const presentLimitedPicker = useLibrary((s) => s.presentLimitedPicker);
  const includeFavorites = useSettings((s) => s.settings.includeFavorites);
  const loadQueue = useQueue((s) => s.load);
  const [focused, setFocused] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      void refresh();
      void loadQueue();
      return () => setFocused(false);
    }, [refresh, loadQueue]),
  );

  const reviewable = useMemo(() => applyFavoriteProtection(items, includeFavorites), [items, includeFavorites]);
  const unreviewed = useMemo(() => reviewable.filter((i) => !reviewedIds.has(i.id)), [reviewable, reviewedIds]);
  const photoCount = useMemo(() => onlyKind(reviewable, 'photo').length, [reviewable]);
  const videoCount = useMemo(() => onlyKind(reviewable, 'video').length, [reviewable]);
  const sessionCount = Math.min(SESSION_SIZE, unreviewed.length);
  const heroItems = useMemo(() => onlyKind(unreviewed, 'photo').slice(0, 3), [unreviewed]);
  const thumbs = useThumbs(heroItems, 3);
  const heroUris = heroItems.map((i) => thumbs[i.id]);

  const hasAccess = access === 'all' || access === 'limited';
  const emptyLibrary = hasAccess && !loading && reviewable.length === 0;
  const exhausted = hasAccess && reviewable.length > 0 && unreviewed.length === 0;
  const go = (kind: CollectionKind, title: string) => router.push({ pathname: '/swipe', params: { kind, key: '', title } });

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: theme.spacing.page, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} accessible accessibilityRole="header" accessibilityLabel={t('app.name')}>
            <View style={{ width: 17, height: 22, borderRadius: 4, backgroundColor: theme.colors.destructive, transform: [{ rotate: '-12deg' }] }} />
            <T variant="meta" style={{ fontSize: 13, fontWeight: '700', letterSpacing: -0.2 }}>
              {t('app.brand')}
            </T>
          </View>
          <Pressable
            onPress={() => router.push('/settings')}
            accessibilityRole="button"
            accessibilityLabel={t('action.settings')}
            hitSlop={10}
            style={{ width: 44, height: 44, alignItems: 'flex-end', justifyContent: 'center' }}
          >
            <Ionicons name="menu" size={26} color={theme.colors.text} />
          </Pressable>
        </View>

        <T variant="eyebrow" tone="secondary" style={{ marginTop: 10 }}>
          {t('discover.eyebrow')}
        </T>
        <T variant="hero" style={{ marginTop: 12 }} accessibilityRole="header">
          {t('discover.title')}
        </T>
        <T variant="body" tone="secondary" style={{ marginTop: 14 }}>
          {t('discover.body')}
        </T>

        <View style={{ marginTop: 24, marginBottom: 16 }}>
          <PrintStack uris={heroUris} paused={!focused} />
        </View>

        {!hasAccess ? (
          <View style={{ gap: 12 }}>
            <Callout title={t('permission.denied')}>{t('permission.deniedBody')}</Callout>
            <PrimaryButton
              label={access === 'undetermined' ? t('permission.choose') : t('permission.settings')}
              onPress={() => (access === 'undetermined' ? void requestAccess() : void Linking.openSettings())}
            />
          </View>
        ) : emptyLibrary ? (
          <Callout title={t('empty.library')}>{t('empty.libraryBody')}</Callout>
        ) : (
          <>
            <PrimaryButton label={t('action.random')} onPress={() => go('random', t('action.random'))} disabled={exhausted} />
            <T variant="meta" tone="secondary" style={{ textAlign: 'center', marginTop: 10, marginBottom: 22, fontSize: 11 }}>
              {exhausted ? t('empty.all') : t('discover.sub', { count: sessionCount })}
            </T>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Tile title={t('discover.photos')} sub={t('discover.moments', { count: photoCount })} onPress={() => go('photos', t('discover.photos'))} />
              <Tile title={t('discover.videos')} sub={t('discover.stories', { count: videoCount })} onPress={() => go('videos', t('discover.videos'))} />
            </View>
            {access === 'limited' ? (
              <Pressable onPress={() => void presentLimitedPicker()} accessibilityRole="button" style={{ marginTop: 16, minHeight: 44, justifyContent: 'center' }}>
                <T variant="meta" tone="secondary" style={{ textAlign: 'center' }}>
                  {t('permission.limited')} · {t('permission.manage')}
                </T>
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
