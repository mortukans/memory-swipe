import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, View } from 'react-native';
import { useLibrary } from '../src/state/library';
import { useSettings } from '../src/state/settings';
import { Callout } from '../src/ui/components/Callout';
import { PrimaryButton } from '../src/ui/components/PrimaryButton';
import { PrintStack } from '../src/ui/components/PrintStack';
import { Screen } from '../src/ui/components/Screen';
import { T } from '../src/ui/components/Text';
import { useTheme } from '../src/ui/theme';

/**
 * Welcome: one screen, one decision. Explains why photo access is needed and
 * asks only after an explicit tap. "Not now" is a real option — the app opens
 * to a calm, honest no-access state rather than a prompt loop.
 */
export default function Welcome() {
  const { t } = useTranslation();
  const theme = useTheme();
  const update = useSettings((s) => s.update);
  const access = useLibrary((s) => s.access);
  const requestAccess = useLibrary((s) => s.requestAccess);
  const [busy, setBusy] = useState(false);

  const finish = async (ask: boolean) => {
    setBusy(true);
    if (ask) {
      try {
        await requestAccess();
      } catch {
        /* home surfaces the resulting state */
      }
    }
    await update({ onboarded: true });
    router.replace('/');
  };

  const denied = access === 'none';

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: theme.spacing.xl }} showsVerticalScrollIndicator={false}>
        <T variant="eyebrow" tone="secondary" style={{ marginTop: 18 }}>
          {t('onboarding.eyebrow')}
        </T>
        <View style={{ marginTop: 8 }}>
          <PrintStack uris={[]} height={250} />
        </View>
        <T variant="hero" style={{ marginTop: 4 }}>
          {t('onboarding.title')}
        </T>
        <T variant="body" tone="secondary" style={{ marginTop: 14 }}>
          {t('onboarding.body')}
        </T>
        <View style={{ marginTop: 22 }}>
          <Callout>{t('onboarding.privacy')}</Callout>
        </View>
        <View style={{ flex: 1, minHeight: 24 }} />
        <View style={{ gap: 8 }}>
          {denied ? (
            <>
              <T variant="heading">{t('permission.denied')}</T>
              <T variant="body" tone="secondary" style={{ marginBottom: 8 }}>
                {t('permission.deniedBody')}
              </T>
              <PrimaryButton label={t('permission.settings')} onPress={() => void Linking.openSettings()} />
            </>
          ) : (
            <PrimaryButton label={t('permission.choose')} loading={busy} onPress={() => void finish(true)} />
          )}
          <PrimaryButton label={t('permission.later')} variant="ghost" arrow={false} onPress={() => void finish(false)} />
        </View>
      </ScrollView>
    </Screen>
  );
}
