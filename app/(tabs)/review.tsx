import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, useWindowDimensions, View } from 'react-native';
import { useLibrary } from '../../src/state/library';
import { useQueue } from '../../src/state/queue';
import { useSettings } from '../../src/state/settings';
import { Callout } from '../../src/ui/components/Callout';
import { PrimaryButton } from '../../src/ui/components/PrimaryButton';
import { ReviewTile } from '../../src/ui/components/ReviewTile';
import { Screen } from '../../src/ui/components/Screen';
import { T } from '../../src/ui/components/Text';
import { haptic } from '../../src/ui/haptics';
import { useTheme } from '../../src/ui/theme';

/**
 * Review: one last look at everything set aside. Tap restores. Delete goes
 * through an app confirmation, then the OS's own. Counts only — no made-up
 * "space freed". On cancel or failure you stay here with the queue intact.
 */
export default function Review() {
  const { t } = useTranslation();
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

  const onDelete = () => {
    Alert.alert(t('review.confirm'), t('review.confirmBody'), [
      { text: t('action.cancel'), style: 'cancel' },
      {
        text: t('action.delete', { count: ids.length }),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            haptic('remove', hapticsOn);
            const r = await confirmDelete();
            if (r.deleted > 0 && r.remaining === 0) setBanner(t('review.deleted', { count: r.deleted }));
            else if (r.deleted > 0) setBanner(t('review.partial', { count: r.remaining }));
            else if (!r.cancelled) setBanner(t('review.error'));
          })();
        },
      },
    ]);
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <T variant="eyebrow" tone="secondary" style={{ textAlign: 'center', paddingVertical: 18 }}>
          {t('review.eyebrow')}
        </T>
        <T variant="title">{t('review.title')}</T>

        {banner ? (
          <View style={{ marginTop: 12 }} accessibilityLiveRegion="polite">
            <Callout>{banner}</Callout>
          </View>
        ) : null}

        {ids.length === 0 ? (
          <View style={{ marginTop: 16, gap: 12 }}>
            <T variant="body" tone="secondary">
              {loading ? t('loading.photo') : t('review.empty')}
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
              {ids.map((id) => {
                const it = byId.get(id);
                const p = previews[id];
                const isVideo = it?.kind === 'video' || p?.kind === 'video';
                return (
                  <ReviewTile
                    key={id}
                    uri={p && !isVideo ? p.uri : null}
                    size={cell}
                    isVideo={isVideo}
                    isFavorite={it?.isFavorite}
                    keepLabel={t('review.keepBadge')}
                    onRestore={() => {
                      haptic('select', hapticsOn);
                      void pull(id);
                    }}
                  />
                );
              })}
            </View>

            <View style={{ marginTop: 22 }}>
              <Callout title={t('review.calloutTitle')}>{t('review.warning')}</Callout>
            </View>

            <View style={{ marginTop: 20, gap: 8 }}>
              <PrimaryButton label={t('action.delete', { count: ids.length })} variant="danger" loading={deleting} onPress={onDelete} />
              <PrimaryButton label={t('action.keepAll')} variant="ghost" arrow={false} onPress={() => void clearAll()} />
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
