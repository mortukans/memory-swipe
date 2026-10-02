import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
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
 * The layout scrolls (large text), controls freeze during the fly-out, and a
 * stale session can never trigger completion for a new one.
 */
export default function Swipe() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ kind: string; key: string; title: string; filter?: string }>();
  const collection: CollectionRef = { kind: (params.kind as CollectionKind) ?? 'random', key: params.key ?? '' };
  const filter = (params.filter || null) as MediaFilter | null;
  const title = params.title || t('action.random');

  const hapticsOn = useSettings((s) => s.settings.haptics);
  const start = useSession((s) => s.start);
  const state = useSession((s) => s.state);
  const items = useSession((s) => s.items);
  const eligible = useSession((s) => s.eligible);
  const generation = useSession((s) => s.generation);
  const preview = useSession((s) => s.preview);
  const previewLoading = useSession((s) => s.previewLoading);
  const previewError = useSession((s) => s.previewError);
  const starting = useSession((s) => s.starting);
  const keep = useSession((s) => s.keep);
  const remove = useSession((s) => s.remove);
  const skip = useSession((s) => s.skip);
  const undo = useSession((s) => s.undo);
  const retryPreview = useSession((s) => s.retryPreview);
  const deckRef = useRef<SwipeDeckHandle>(null);
  const [animating, setAnimating] = useState(false);
  const [focused, setFocused] = useState(true);
  /** The generation this screen started; completion only counts for it. */
  const myGen = useRef<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  useEffect(() => {
    myGen.current = null;
    void start(collection, filter).then(() => {
      myGen.current = useSession.getState().generation;
    });
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
  // Never show a preview that belongs to a different card than the one being decided.
  const safePreview = preview && curId && preview.id === curId ? preview : null;

  // Done: hand the facts to the session-end screen — only for the session this screen started.
  useEffect(() => {
    if (starting || !state || !complete || total === 0) return;
    if (myGen.current === null || myGen.current !== generation) return;
    router.replace({
      pathname: '/session-end',
      params: {
        reviewed: String(c?.reviewed ?? 0),
        kept: String(c?.kept ?? 0),
        remaining: String(Math.max(0, eligible - (c?.reviewed ?? 0))),
        kind: collection.kind,
        key: collection.key,
        filter: filter ?? '',
        title,
      },
    });
    useSession.getState().reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete, starting]);

  const announceQueue = (n: number) => {
    try {
      AccessibilityInfo.announceForAccessibility(t('a11y.queued', { count: n }));
    } catch {
      /* web */
    }
  };

  const mediaLabels = { loading: t('loading.photo'), errorTitle: t('loading.error'), errorBody: t('loading.errorBody'), retry: t('action.retry') };
  const actionLabels = { keep: t('action.keep'), remove: t('action.remove'), skip: t('action.skip'), undo: t('action.undo') };
  const kindLabel = cur?.kind === 'video' ? t('a11y.video') : t('a11y.photo');
  const cardLabel = [kindLabel, t('a11y.indexOf', { index: Math.min(idx + 1, total), total }), caption, meta].filter(Boolean).join(', ');
  const cardMinHeight = Math.min(width * 1.15, 452);

  const exhausted = !starting && total === 0;

  return (
    <Screen>
      <TopBar eyebrow={title} backLabel={t('action.back')} />

      {exhausted ? (
        <View style={{ flex: 1, justifyContent: 'center', gap: 12 }}>
          <T variant="title">{t('empty.scope')}</T>
          <T variant="body" tone="secondary">
            {t('empty.scopeBody')}
          </T>
          <PrimaryButton label={t('action.back')} arrow={false} onPress={() => router.back()} style={{ marginTop: 12 }} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2, gap: 12 }}>
            <T variant="eyebrow" tone="secondary" style={{ flexShrink: 1 }}>
              {t('session.label')}
            </T>
            <T variant="meta" tone="secondary">
              {starting ? '…' : t('session.progress', { current: Math.min(idx + 1, total), total })}
            </T>
          </View>
          <View style={{ marginTop: 10, marginBottom: 18 }}>
            <SessionRibbon
              total={total}
              marks={marks}
              accessibilityLabel={t('a11y.ribbon', { kept: c?.kept ?? 0, removed: c?.queued ?? 0, skipped: c?.skipped ?? 0 })}
            />
          </View>

          <View style={{ flex: 1, minHeight: cardMinHeight, marginBottom: 22 }}>
            <SwipeDeck
              ref={deckRef}
              preview={safePreview}
              loading={starting || previewLoading}
              error={previewError}
              cardKey={curId ?? 'none'}
              caption={caption}
              meta={meta}
              accessibilityLabel={cardLabel}
              accessibilityHint={t('a11y.cardHint')}
              canDecide={!previewError && !starting}
              canUndo={state ? canUndo(state) : false}
              active={focused}
              onKeep={() => {
                void keep();
                announceQueue(c?.queued ?? 0);
              }}
              onRemove={() => {
                void remove();
                announceQueue((c?.queued ?? 0) + 1);
              }}
              onSkip={() => skip()}
              onUndo={() => {
                haptic('select', hapticsOn);
                void undo();
              }}
              onRetry={() => void retryPreview()}
              onBusyChange={setAnimating}
              mediaLabels={mediaLabels}
              labels={actionLabels}
              haptics={hapticsOn}
            />
          </View>

          <DecisionControls
            onUndo={() => {
              haptic('select', hapticsOn);
              void undo();
              try {
                AccessibilityInfo.announceForAccessibility(t('a11y.undone'));
              } catch {
                /* web */
              }
            }}
            onRemove={() => deckRef.current?.commit('remove')}
            onSkip={() => {
              haptic('light', hapticsOn);
              deckRef.current?.commit('skip');
            }}
            onKeep={() => deckRef.current?.commit('keep')}
            canUndo={state ? canUndo(state) : false}
            disabled={animating || starting}
            decisionsDisabled={previewError}
            labels={actionLabels}
            hints={{ skip: t('a11y.cardHint') }}
          />

          <Pressable
            onPress={() => (c && c.queued > 0 ? router.push('/review') : undefined)}
            disabled={!c || c.queued === 0}
            accessibilityRole={c && c.queued > 0 ? 'button' : 'text'}
            accessibilityLabel={c && c.queued > 0 ? `${t('session.safety')} ${t('session.reviewCount', { count: c.queued })}` : t('session.safety')}
            style={{ alignItems: 'center', marginTop: 16, marginBottom: 6, minHeight: 24, justifyContent: 'center' }}
          >
            <T variant="meta" tone="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
              {c && c.queued > 0 ? `${t('session.safety')} · ${t('session.reviewCount', { count: c.queued })}` : t('session.safety')}
            </T>
          </Pressable>
        </ScrollView>
      )}
    </Screen>
  );
}
