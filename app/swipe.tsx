import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';
import type { CollectionKind, CollectionRef } from '../src/collections';
import { canUndo, counts, currentId, isComplete } from '../src/review/machine';
import { useSession } from '../src/state/session';
import { useSettings } from '../src/state/settings';
import { Button } from '../src/ui/components/Button';
import { Screen } from '../src/ui/components/Screen';
import { SwipeControls } from '../src/ui/components/SwipeControls';
import { SwipeDeck } from '../src/ui/components/SwipeDeck';
import { T } from '../src/ui/components/Text';
import { haptic } from '../src/ui/haptics';
import { useTheme } from '../src/ui/theme';

export default function SwipeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const params = useLocalSearchParams<{ kind: string; key: string; title: string }>();
  const collection: CollectionRef = { kind: (params.kind as CollectionKind) ?? 'random', key: params.key ?? '' };
  const title = params.title || t('app.name');

  const hapticsOn = useSettings((s) => s.settings.haptics);
  const start = useSession((s) => s.start);
  const state = useSession((s) => s.state);
  const preview = useSession((s) => s.preview);
  const previewLoading = useSession((s) => s.previewLoading);
  const previewError = useSession((s) => s.previewError);
  const starting = useSession((s) => s.starting);
  const keep = useSession((s) => s.keep);
  const remove = useSession((s) => s.remove);
  const skip = useSession((s) => s.skip);
  const undo = useSession((s) => s.undo);

  useEffect(() => {
    void start(collection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.kind, params.key]);

  const onKeep = () => {
    haptic('keep', hapticsOn);
    void keep();
  };
  const onRemove = () => {
    haptic('remove', hapticsOn);
    void remove();
  };
  const onSkip = () => {
    haptic('light', hapticsOn);
    skip();
  };
  const onUndo = () => {
    haptic('select', hapticsOn);
    void undo();
  };

  const c = state ? counts(state) : null;
  const complete = state ? isComplete(state) : false;
  const total = state?.order.length ?? 0;
  const position = state ? Math.min(state.index + 1, total) : 0;
  const curId = state ? currentId(state) : undefined;

  const mediaLabels = {
    loading: t('swipe.loadingPhoto'),
    unavailableTitle: t('swipe.unavailableTitle'),
    unavailableBody: t('swipe.unavailableBody'),
  };

  return (
    <Screen>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.sm }}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('common.back')}>
          <Ionicons name="chevron-back" size={26} color={theme.colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <T variant="heading" numberOfLines={1}>
            {title}
          </T>
          {total > 0 && !complete ? (
            <T variant="caption" tone="dim">
              {t('swipe.position', { index: position, total })}
            </T>
          ) : null}
        </View>
      </View>

      {starting ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      ) : total === 0 ? (
        <EmptyOrDone
          icon="checkmark-done-outline"
          title={t('swipe.emptyTitle')}
          body={t('swipe.emptyBody')}
          primary={t('common.done')}
          onPrimary={() => router.back()}
        />
      ) : complete ? (
        <EmptyOrDone
          icon="sparkles-outline"
          title={t('swipe.doneTitle')}
          body={t('swipe.doneReviewed', { count: c?.reviewed ?? 0 })}
          primary={t('swipe.finish')}
          onPrimary={() => router.back()}
          secondary={c && c.queued > 0 ? t('swipe.goToReview', { count: c.queued }) : undefined}
          onSecondary={() => router.push('/review')}
        />
      ) : (
        <>
          <View style={{ flex: 1, paddingVertical: theme.spacing.md }}>
            <SwipeDeck
              preview={preview}
              loading={previewLoading}
              error={previewError}
              cardKey={curId ?? 'none'}
              onKeep={onKeep}
              onRemove={onRemove}
              mediaLabels={mediaLabels}
              keepBadge={t('swipe.keep')}
              removeBadge={t('swipe.remove')}
            />
          </View>
          <View style={{ gap: theme.spacing.md, paddingBottom: theme.spacing.sm }}>
            <SwipeControls
              onKeep={onKeep}
              onRemove={onRemove}
              onSkip={onSkip}
              onUndo={onUndo}
              canUndo={state ? canUndo(state) : false}
              labels={{ keep: t('swipe.keep'), remove: t('swipe.remove'), skip: t('swipe.skip'), undo: t('swipe.undo') }}
            />
            {c && c.queued > 0 ? (
              <Pressable onPress={() => router.push('/review')} accessibilityRole="button" style={{ alignItems: 'center' }}>
                <T variant="caption" tone="remove">
                  {t('swipe.goToReview', { count: c.queued })}
                </T>
              </Pressable>
            ) : null}
          </View>
        </>
      )}
    </Screen>
  );
}

function EmptyOrDone({
  icon,
  title,
  body,
  primary,
  onPrimary,
  secondary,
  onSecondary,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  primary: string;
  onPrimary: () => void;
  secondary?: string;
  onSecondary?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: theme.spacing.lg, paddingHorizontal: theme.spacing.md }}>
      <Ionicons name={icon} size={52} color={theme.colors.accent} />
      <T variant="title" style={{ textAlign: 'center' }}>
        {title}
      </T>
      <T variant="body" tone="dim" style={{ textAlign: 'center' }}>
        {body}
      </T>
      <View style={{ alignSelf: 'stretch', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
        {secondary && onSecondary ? <Button label={secondary} variant="danger" icon="trash-outline" onPress={onSecondary} /> : null}
        <Button label={primary} variant={secondary ? 'secondary' : 'primary'} onPress={onPrimary} />
      </View>
    </View>
  );
}
