import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useQueue } from '../src/state/queue';
import { useSettings } from '../src/state/settings';
import { Button } from '../src/ui/components/Button';
import { Screen } from '../src/ui/components/Screen';
import { T } from '../src/ui/components/Text';
import { haptic } from '../src/ui/haptics';
import { useTheme } from '../src/ui/theme';

export default function ReviewScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const hapticsOn = useSettings((s) => s.settings.haptics);

  const ids = useQueue((s) => s.ids);
  const previews = useQueue((s) => s.previews);
  const loading = useQueue((s) => s.loading);
  const deleting = useQueue((s) => s.deleting);
  const load = useQueue((s) => s.load);
  const pull = useQueue((s) => s.pull);
  const clearAll = useQueue((s) => s.clearAll);
  const confirmDelete = useQueue((s) => s.confirmDelete);

  useEffect(() => {
    void load();
  }, [load]);

  const gutter = theme.spacing.lg;
  const gap = theme.spacing.sm;
  const cols = 3;
  const cell = Math.floor((width - gutter * 2 - gap * (cols - 1)) / cols);

  const onDelete = async () => {
    haptic('remove', hapticsOn);
    const result = await confirmDelete();
    router.replace({
      pathname: '/result',
      params: { deleted: String(result.deleted), remaining: String(result.remaining), cancelled: result.cancelled ? '1' : '0' },
    });
  };

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: gutter, paddingTop: theme.spacing.sm, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('common.back')}>
          <Ionicons name="chevron-back" size={26} color={theme.colors.text} />
        </Pressable>
        <T variant="heading" style={{ flex: 1 }}>
          {t('review.title')}
        </T>
        {ids.length > 0 ? (
          <Pressable onPress={() => void clearAll()} hitSlop={8} accessibilityRole="button">
            <T variant="label" tone="accent">
              {t('review.keepAll')}
            </T>
          </Pressable>
        ) : null}
      </View>

      {ids.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: theme.spacing.md, paddingHorizontal: gutter }}>
          <Ionicons name="checkmark-circle-outline" size={48} color={theme.colors.keep} />
          <T variant="body" tone="dim" style={{ textAlign: 'center' }}>
            {loading ? t('common.loading') : t('review.empty')}
          </T>
          <Button label={t('common.done')} variant="secondary" onPress={() => router.back()} />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: theme.spacing.lg, gap: theme.spacing.lg }}>
            <T variant="caption" tone="dim" style={{ marginTop: theme.spacing.sm }}>
              {t('review.subtitle', { count: ids.length })}
            </T>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
              {ids.map((id) => {
                const p = previews[id];
                return (
                  <Pressable
                    key={id}
                    onPress={() => {
                      haptic('select', hapticsOn);
                      void pull(id);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={t('review.removeThis')}
                    style={{ width: cell, height: cell, borderRadius: theme.radius.sm, overflow: 'hidden', backgroundColor: theme.colors.surfaceAlt }}
                  >
                    {p ? (
                      <Image source={{ uri: p.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" cachePolicy="memory-disk" />
                    ) : (
                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="image-outline" size={22} color={theme.colors.textFaint} />
                      </View>
                    )}
                    <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: theme.colors.overlay, borderRadius: 999, padding: 3 }}>
                      <Ionicons name="arrow-undo" size={14} color="#fff" />
                    </View>
                    {p?.kind === 'video' ? (
                      <View style={{ position: 'absolute', bottom: 4, left: 4 }}>
                        <Ionicons name="videocam" size={14} color="#fff" />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            <View style={{ backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.lg, gap: theme.spacing.sm }}>
              <T variant="label">{t('review.warningTitle')}</T>
              <Warning text={t('review.warningDeletesLibrary')} />
              <Warning text={t('review.warningICloud')} />
              <Warning text={t('review.warningRecentlyDeleted')} />
            </View>
          </ScrollView>

          <View style={{ paddingHorizontal: gutter, paddingBottom: theme.spacing.lg, paddingTop: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
            <Button
              label={t('review.deleteButton', { count: ids.length })}
              variant="danger"
              icon="trash-outline"
              loading={deleting}
              onPress={() => void onDelete()}
            />
          </View>
        </>
      )}
    </Screen>
  );
}

function Warning({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
      <Ionicons name="information-circle-outline" size={16} color={theme.colors.textDim} style={{ marginTop: 2 }} />
      <T variant="caption" tone="dim" style={{ flex: 1 }}>
        {text}
      </T>
    </View>
  );
}
