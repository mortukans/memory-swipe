import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Alert, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
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

/**
 * Review: one last look at everything set aside. Tap restores. Delete goes
 * through an app confirmation, then the OS's own. Counts only — no made-up
 * "space freed". On cancel or failure you stay here with the queue intact, and
 * the banner says exactly what happened.
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

  useFocusEffect(
    useCallback(() => {
      void load();
      setBanner(null);
    }, [load]),
  );

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const gutter = theme.spacing.page;
  const gap = 8;
  const cols = 3;
  const cell = Math.floor((width - gutter * 2 - gap * (cols - 1)) / cols);

  const restoreFocus = () => {
    try {
      if (deleteRef.current) AccessibilityInfo.sendAccessibilityEvent(deleteRef.current, 'focus');
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
            try {
              const r = await confirmDelete();
              const parts: string[] = [];
              if (r.deleted > 0) parts.push(t('review.deleted', { count: r.deleted }));
              if (r.deleted > 0 && r.remaining > 0) parts.push(t('review.partial', { count: r.remaining }));
              if (r.unavailable > 0) parts.push(t('review.unavailable', { count: r.unavailable }));
              if (r.failed) parts.push(t('review.error'));
              setBanner(parts.length ? parts.join(' ') : null);
            } catch {
              setBanner(t('review.error'));
            }
            restoreFocus();
          })();
        },
      },
    ]);
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
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
        <T variant="title" accessibilityRole="header">
          {t('review.title')}
        </T>

        {banner ? (
          <View style={{ marginTop: 12 }} accessibilityLiveRegion="polite">
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
            <T variant="body" tone="secondary" style={{ marginTop: 8 }} accessibilityLiveRegion="polite">
              {t('review.selected', { count: ids.length })}
            </T>
            <T variant="eyebrow" tone="secondary" style={{ marginTop: 20, marginBottom: 10 }}>
              {t('review.restore')}
            </T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
              {ids.map((id, index) => {
                const it = byId.get(id);
                const p = previews[id];
                const isVideo = it?.kind === 'video' || p?.kind === 'video';
                const uri = p?.uri ?? (id.startsWith('ph://') ? id : `ph://${id}`);
                const kind = isVideo ? t('a11y.video') : t('a11y.photo');
                const date = it ? dateLabel(i18n.language, it.creationTime) : '';
                return (
                  <ReviewTile
                    key={id}
                    uri={uri}
                    size={cell}
                    isVideo={isVideo}
                    isFavorite={it?.isFavorite}
                    keepLabel={t('review.keepBadge')}
                    accessibilityLabel={t('a11y.reviewTile', { kind, date, index: index + 1, total: ids.length })}
                    accessibilityHint={t('a11y.restoreHint')}
                    onRestore={() => {
                      haptic('select', hapticsOn);
                      void pull(id).then(() => {
                        try {
                          AccessibilityInfo.announceForAccessibility(t('a11y.queued', { count: Math.max(0, ids.length - 1) }));
                        } catch {
                          /* web */
                        }
                      });
                    }}
                  />
                );
              })}
            </View>

            <View style={{ marginTop: 22 }}>
              <Callout title={t('review.calloutTitle')}>{t('review.warning')}</Callout>
            </View>

            <View style={{ marginTop: 20, gap: 8 }} ref={deleteRef}>
              <PrimaryButton label={t('action.delete', { count: ids.length })} variant="danger" loading={deleting} onPress={onDelete} />
              <PrimaryButton label={t('action.keepAll')} variant="ghost" arrow={false} onPress={() => void clearAll()} />
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
