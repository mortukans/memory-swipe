import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useQueue } from '../src/state/queue';
import { OrbitalCount } from '../src/ui/components/OrbitalCount';
import { PrimaryButton } from '../src/ui/components/PrimaryButton';
import { Screen } from '../src/ui/components/Screen';
import { T } from '../src/ui/components/Text';
import { TopBar } from '../src/ui/components/TopBar';

/** Session end: a kept count, a gentle line, and the two honest next steps. */
export default function SessionEnd() {
  const { t } = useTranslation();
  const p = useLocalSearchParams<{ reviewed: string; kept: string; remaining: string; kind: string; key: string; filter: string; title: string }>();
  const reviewed = Number(p.reviewed ?? 0);
  const kept = Number(p.kept ?? 0);
  const remaining = Number(p.remaining ?? 0);
  const pending = useQueue((s) => s.ids.length);
  const loadQueue = useQueue((s) => s.load);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const another = () =>
    router.replace({ pathname: '/swipe', params: { kind: p.kind ?? 'random', key: p.key ?? '', filter: p.filter ?? '', title: p.title ?? '' } });

  return (
    <Screen>
      <TopBar eyebrow={t('session.endEyebrow')} backLabel={t('action.back')} onBack={() => router.replace('/')} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        <View style={{ marginTop: 24 }}>
          <OrbitalCount count={kept} unit={t('session.kept')} />
        </View>
        <T variant="eyebrow" tone="secondary" style={{ textAlign: 'center', marginTop: 10 }}>
          {t('session.revisited', { count: reviewed })}
        </T>
        <T variant="title" style={{ textAlign: 'center', marginTop: 16 }}>
          {t('session.complete')}
        </T>
        <T variant="body" tone="secondary" style={{ textAlign: 'center', marginTop: 14 }}>
          {pending > 0 ? t('session.pending', { count: pending }) : t('session.nothingPending')}
        </T>
        <View style={{ flex: 1, minHeight: 24 }} />
        <View style={{ gap: 8 }}>
          {pending > 0 ? <PrimaryButton label={t('action.review')} onPress={() => router.replace('/review')} /> : null}
          {remaining > 0 ? <PrimaryButton label={t('action.another')} variant={pending > 0 ? 'lime' : 'ink'} onPress={another} /> : null}
          <PrimaryButton label={t('action.done')} variant="ghost" arrow={false} onPress={() => router.replace('/')} />
        </View>
      </ScrollView>
    </Screen>
  );
}
