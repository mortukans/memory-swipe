import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Alert, FlatList, Pressable, useWindowDimensions, View } from 'react-native';
import { useLibrary } from '../../src/state/library';
import { useQueue } from '../../src/state/queue';
import { useSettings } from '../../src/state/settings';
import { Callout } from '../../src/ui/components/Callout';
import { PrimaryButton } from '../../src/ui/components/PrimaryButton';
import { ReviewTile } from '../../src/ui/components/ReviewTile';
import { Screen } from '../../src/ui/components/Screen';
import { T } from '../../src/ui/components/Text';
import { dateLabel } from '../../src/ui/format';
import { haptic } from '../../src/ui/haptics';
import { useTheme } from '../../src/ui/theme';

function announce(text: string) {
  try {
    AccessibilityInfo.announceForAccessibility(text);
  } catch {
    /* web */
  }
}

const COLS = 3;
const GAP = 8;

/**
 * Review: one last look at everything set aside. Tap restores. Delete goes
 * through an app confirmation, then the OS's own. Counts only — no made-up
 * "space freed". On cancel or failure you stay here with the queue intact, and
 * the banner says (and announces) exactly what happened. The grid is
 * virtualised: the queue spans sessions and can grow large.
 */
export default function Review() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const ids = useQueue((s) => s.ids);
  const previews = useQueue((s) => s.previews);
  const loading = useQueue((s) => s.loading);
  const deleting = useQueue((s) => s.deleting);
  const load = useQueue((s) => s.load);
  const pull = useQueue((s) => s.pull);
  const clearAll = useQueue((s) => s.clearAll);
  const confirmDelete = useQueue((s) => s.confirmDelete);
  const items = useLibrary((s) => s.items);
  const hapticsOn = useSettings((s) => s.settings.haptics);
  const [banner, setBanner] = useState<string | null>(null);
  const deleteRef = useRef<View>(null);
  const titleRef = useRef<View>(null);

  useFocusEffect(
    useCallback(() => {
      void load();
      setBanner(null);
    }, [load]),
  );

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const gutter = theme.spacing.page;
  const cell = Math.floor((width - gutter * 2 - GAP * (COLS - 1)) / COLS);

  const restoreFocus = () => {
    try {
      const target = deleteRef.current ?? titleRef.current;
      if (target) AccessibilityInfo.sendAccessibilityEvent(target, 'focus');
    } catch {
      /* web */
    }
  };

  const onDelete = () => {
    Alert.alert(t('review.confirm'), t('review.confirmBody'), [
      { text: t('action.cancel'), style: 'cancel', onPress: restoreFocus },
      {
        text: t('action.delete', { count: ids.length }),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            haptic('remove', hapticsOn);
            let msg: string | null = null;
            try {
              const r = await confirmDelete();
              const parts: string[] = [];
              if (r.deleted > 0) parts.push(t('review.deleted', { count: r.deleted }));
              if (r.deleted > 0 && r.remaining > 0) parts.push(t('review.partial', { count: r.remaining }));
              if (r.unavailable > 0) parts.push(t('review.unavailable', { count: r.unavailable }));
              if (r.failed) parts.push(t('review.error'));
              msg = parts.length ? parts.join(' ') : null;
            } catch {
              msg = t('review.error');
            }
            setBanner(msg);
            if (msg) announce(msg);
            setTimeout(restoreFocus, 250);
          })();
        },
      },
    ]);
  };

  const header = (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingVertical: 8 }}>
        <View style={{ width: 44 }} />
        <T variant="eyebrow" tone="secondary" style={{ flex: 1, textAlign: 'center' }}>
          {t('review.eyebrow')}
        </T>
        <Pressable
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel={t('action.settings')}
          hitSlop={10}
          style={{ width: 44, height: 44, alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <Ionicons name="menu" size={24} color={theme.colors.text} />
        </Pressable>
      </View>
      <View ref={titleRef} accessible accessibilityRole="header">
        <T variant="title">{t('review.title')}</T>
      </View>

      {banner ? (
        <View style={{ marginTop: 12 }}>
          <Callout>{banner}</Callout>
        </View>
      ) : null}

      {ids.length === 0 ? (
        <View style={{ marginTop: 16, gap: 12 }}>
          <T variant="body" tone="secondary">
            {loading ? t('loading.queue') : t('review.empty')}
          </T>
          {!loading ? <Callout>{t('review.emptyBody')}</Callout> : null}
        </View>
      ) : (
        <>
          <T variant="body" tone="secondary" style={{ marginTop: 8 }}>
            {t('review.selected', { count: ids.length })}
          </T>
          <T variant="eyebrow" tone="secondary" style={{ marginTop: 20, marginBottom: 10 }}>
            {t('review.restore')}
          </T>
        </>
      )}
    </View>
  );

  const footer =
    ids.length === 0 ? null : (
      <View>
        <View style={{ marginTop: 22 }}>
          <Callout title={t('review.calloutTitle')}>{t('review.warning')}</Callout>
        </View>
        <View style={{ marginTop: 20, gap: 8 }}>
          <PrimaryButton ref={deleteRef} label={t('action.delete', { count: ids.length })} variant="danger" loading={deleting} onPress={onDelete} />
          <PrimaryButton label={t('action.keepAll')} variant="ghost" arrow={false} onPress={() => void clearAll()} />
        </View>
      </View>
    );

  return (
    <Screen padded={false}>
      <FlatList
        data={ids}
        keyExtractor={(id) => id}
        numColumns={COLS}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 120, gap: GAP }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        initialNumToRender={12}
        windowSize={7}
        removeClippedSubviews
        renderItem={({ item: id, index }) => {
          const it = byId.get(id);
          const p = previews[id];
          const isVideo = it?.kind === 'video' || p?.kind === 'video';
          const uri = p?.uri ?? (id.startsWith('ph://') ? id : `ph://${id}`);
          const kind = isVideo ? t('a11y.video') : t('a11y.photo');
          const date = it ? dateLabel(i18n.language, it.creationTime) : '';
          const label = [t('review.keepBadge'), kind, date, t('a11y.indexOf', { index: index + 1, total: ids.length })].filter(Boolean).join(', ');
          return (
            <ReviewTile
              uri={uri}
              size={cell}
              isVideo={isVideo}
              isFavorite={it?.isFavorite}
              keepLabel={t('review.keepBadge')}
              accessibilityLabel={label}
              accessibilityHint={t('a11y.restoreHint')}
              onRestore={() => {
                haptic('select', hapticsOn);
                void pull(id).then(() => announce(t('a11y.queued', { count: Math.max(0, ids.length - 1) })));
              }}
            />
          );
        }}
      />
    </Screen>
  );
}
