import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useLibrary } from '../src/state/library';
import { useSettings } from '../src/state/settings';
import { Button } from '../src/ui/components/Button';
import { Screen } from '../src/ui/components/Screen';
import { T } from '../src/ui/components/Text';
import { useTheme } from '../src/ui/theme';

type Slide = { icon: keyof typeof Ionicons.glyphMap; titleKey: string; bodyKey: string };

const SLIDES: Slide[] = [
  { icon: 'sparkles-outline', titleKey: 'onboarding.slide1Title', bodyKey: 'onboarding.slide1Body' },
  { icon: 'heart-outline', titleKey: 'onboarding.slide2Title', bodyKey: 'onboarding.slide2Body' },
  { icon: 'shield-checkmark-outline', titleKey: 'onboarding.slide3Title', bodyKey: 'onboarding.slide3Body' },
  { icon: 'phone-portrait-outline', titleKey: 'onboarding.slide4Title', bodyKey: 'onboarding.slide4Body' },
];

export default function Onboarding() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const update = useSettings((s) => s.update);
  const requestAccess = useLibrary((s) => s.requestAccess);

  const last = step === SLIDES.length - 1;
  const slide = SLIDES[step];

  const finish = async () => {
    setBusy(true);
    try {
      await requestAccess();
    } catch {
      /* proceed regardless; home surfaces the permission state */
    }
    await update({ onboarded: true });
    router.replace('/');
  };

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: theme.spacing.xl, paddingHorizontal: theme.spacing.md }}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: theme.radius.lg,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.surfaceAlt,
          }}
        >
          <Ionicons name={slide.icon} size={44} color={theme.colors.accent} />
        </View>
        <View style={{ gap: theme.spacing.md, alignItems: 'center' }}>
          <T variant="title" style={{ textAlign: 'center' }}>
            {t(slide.titleKey)}
          </T>
          <T variant="body" tone="dim" style={{ textAlign: 'center' }}>
            {t(slide.bodyKey)}
          </T>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: theme.spacing.xl }}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === step ? 22 : 8,
              height: 8,
              borderRadius: 999,
              backgroundColor: i === step ? theme.colors.accent : theme.colors.surfaceAlt,
            }}
          />
        ))}
      </View>

      <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
        <Button
          label={last ? t('onboarding.getStarted') : t('onboarding.next')}
          icon={last ? 'lock-open-outline' : undefined}
          loading={busy}
          onPress={() => (last ? void finish() : setStep((s) => s + 1))}
        />
        {last ? (
          <T variant="caption" tone="faint" style={{ textAlign: 'center' }}>
            {t('permission.body')}
          </T>
        ) : null}
      </View>
    </Screen>
  );
}
