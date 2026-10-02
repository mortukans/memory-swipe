import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';
import type { CollectionKind, CollectionRef } from '../src/collections';
import { canUndo, counts, currentId, isComplete } from '../src/review/machine';
import { useSession, type MediaFilter } from '../src/state/session';
import { useSettings } from '../src/state/settings';
import { DecisionControls } from '../src/ui/components/DecisionControls';
import { PrimaryButton } from '../src/ui/components/PrimaryButton';
import { Screen } from '../src/ui/components/Screen';
import { SessionRibbon, type RibbonMark } from '../src/ui/components/SessionRibbon';
import { SwipeDeck, type SwipeDeckHandle } from '../src/ui/components/SwipeDeck';
import { T } from '../src/ui/components/Text';
import { TopBar } from '../src/ui/components/TopBar';
import { dateLabel, durationLabel } from '../src/ui/format';
import { haptic } from '../src/ui/haptics';
import { useTheme } from '../src/ui/theme';

/**
 * The session: one fitted print at a time, the ribbon recording each decision,
 * four labelled controls, and the safety line. Up to 20 items; the denominator
 * is always the real one. Completion hands off to the session-end screen.
 */
export default function Swipe() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const params = useLocalSearchParams<{ kind: string; key: string; title: string; filter?: string }>();
  const collection: CollectionRef = { kind: (params.kind as CollectionKind) ?? 'random', key: params.key ?? '' };
  const filter = (params.filter || null) as MediaFilter | null;
  const title = params.title || t('action.random');

  const hapticsOn = useSettings((s) => s.settings.haptics);
  const start = useSession((s) => s.start);
  const state = useSession((s) => s.state);
  const items = useSession((s) => s.items);
  const eligible = useSession((s) => s.eligible);
  const preview = useSession((s) => s.preview);
  const previewLoading = useSession((s) => s.previewLoading);
  const previewError = useSession((s) => s.previewError);
  const starting = useSession((s) => s.starting);
  const keep = useSession((s) => s.keep);
  const remove = useSession((s) => s.remove);
  const skip = useSession((s) => s.skip);
  const undo = useSession((s) => s.undo);
  const deckRef = useRef<SwipeDeckHandle>(null);

  useEffect(() => {
    void start(collection, filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.kind, params.key, params.filter]);

  const total = state?.order.length ?? 0;
  const idx = state ? Math.min(state.index, total) : 0;
  const curId = state ? currentId(state) : undefined;
  const complete = state ? isComplete(state) : false;
  const c = state ? counts(state) : null;
  const marks: RibbonMark[] = state ? state.history.map((h) => h.type) : [];
  const cur = curId ? items[curId] : undefined;
  const caption = cur ? dateLabel(i18n.language, cur.creationTime) : '';
  const meta = cur?.kind === 'video' ? durationLabel(cur.durationSec) : '';

  // Done: hand the facts to the session-end screen.
  useEffect(() => {
    if (!state || !complete || total === 0) return;
    router.replace({
      pathname: '/session-end',
      params: {
        reviewed: String(c?.reviewed ?? 0),
        kept: String(c?.kept ?? 0),
        remaining: String(Math.max(0, eligible - total)),
        kind: collection.kind,
        key: collection.key,
        filter: filter ?? '',
        title,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete]);

  const mediaLabels = { loading: t('loading.photo'), errorTitle: t('loading.error'), errorBody: t('loading.errorBody') };

  return (
    <Screen>
      <TopBar eyebrow={title} backLabel={t('action.back')} />

      {starting ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.colors.secondary} />
        </View>
      ) : total === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', gap: 12 }}>
          <T variant="title">{t('empty.scope')}</T>
          <T variant="body" tone="secondary">
            {t('empty.scopeBody')}
          </T>
          <PrimaryButton label={t('action.back')} arrow={false} onPress={() => router.back()} style={{ marginTop: 12 }} />
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
            <T variant="eyebrow" tone="secondary">
              {t('session.label')}
            </T>
            <T variant="meta" tone="secondary" accessibilityLiveRegion="polite">
              {t('session.progress', { current: Math.min(idx + 1, total), total })}
            </T>
          </View>
          <View style={{ marginTop: 10, marginBottom: 18 }}>
            <SessionRibbon total={total} marks={marks} />
          </View>

          <View style={{ flex: 1, marginBottom: 22 }}>
            <SwipeDeck
              ref={deckRef}
              preview={preview}
              loading={previewLoading}
              error={previewError}
              cardKey={curId ?? 'none'}
              caption={caption}
              meta={meta}
              onKeep={() => void keep()}
              onRemove={() => void remove()}
              mediaLabels={mediaLabels}
              keepLabel={t('action.keep')}
              removeLabel={t('action.remove')}
              haptics={hapticsOn}
            />
          </View>

          <DecisionControls
            onUndo={() => {
              haptic('select', hapticsOn);
              void undo();
            }}
            onRemove={() => deckRef.current?.commit('remove')}
            onSkip={() => {
              haptic('light', hapticsOn);
              skip();
            }}
            onKeep={() => deckRef.current?.commit('keep')}
            canUndo={state ? canUndo(state) : false}
            labels={{ undo: t('action.undo'), remove: t('action.remove'), skip: t('action.skip'), keep: t('action.keep') }}
          />

          <Pressable
            onPress={() => (c && c.queued > 0 ? router.push('/review') : undefined)}
            accessibilityRole={c && c.queued > 0 ? 'button' : undefined}
            style={{ alignItems: 'center', marginTop: 16, marginBottom: 6, minHeight: 24, justifyContent: 'center' }}
          >
            <T variant="meta" tone="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
              {c && c.queued > 0 ? `${t('session.safety')} · ${t('session.reviewCount', { count: c.queued })}` : t('session.safety')}
            </T>
          </Pressable>
        </>
      )}
    </Screen>
  );
}
