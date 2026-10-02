import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, ScrollView, View } from 'react-native';
import type { LanguageSetting, ThemeSetting } from '../src/storage';
import { storage } from '../src/state/instances';
import { useLibrary } from '../src/state/library';
import { useQueue } from '../src/state/queue';
import { useSession } from '../src/state/session';
import { useSettings } from '../src/state/settings';
import { Callout } from '../src/ui/components/Callout';
import { Chip } from '../src/ui/components/Chip';
import { Screen } from '../src/ui/components/Screen';
import { SettingsRow } from '../src/ui/components/SettingsRow';
import { T } from '../src/ui/components/Text';
import { Toggle } from '../src/ui/components/Toggle';
import { TopBar } from '../src/ui/components/TopBar';
import { useTheme } from '../src/ui/theme';

export const PRIVACY_URL = 'https://mortukans.github.io/memory-swipe/privacy/';
export const SUPPORT_URL = 'https://mortukans.github.io/memory-swipe/support/';

/** Settings: small details, your way. Reset clears decisions only, with confirmation. */
export default function SettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);
  const refresh = useLibrary((s) => s.refresh);
  const access = useLibrary((s) => s.access);
  const presentLimitedPicker = useLibrary((s) => s.presentLimitedPicker);
  const loadQueue = useQueue((s) => s.load);

  const resetProgress = () => {
    Alert.alert(t('settings.reset'), t('settings.resetWarning'), [
      { text: t('action.cancel'), style: 'cancel' },
      {
        text: t('settings.reset'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await storage.clearReviews();
            useSession.getState().reset();
            await refresh(true);
            await loadQueue();
          })();
        },
      },
    ]);
  };

  const chips = <V extends string | number>(value: V, opts: { value: V; label: string; a11y?: string }[], onChange: (v: V) => void) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {opts.map((o) => (
        <Chip key={String(o.value)} label={o.label} accessibilityLabel={o.a11y} selected={o.value === value} onPress={() => onChange(o.value)} />
      ))}
    </View>
  );

  const link = (url: string) => (
    <Ionicons name="arrow-forward" size={18} color={theme.colors.secondary} style={{ transform: [{ rotate: '-45deg' }] }} accessibilityElementsHidden />
  );

  return (
    <Screen>
      <TopBar eyebrow={t('settings.eyebrow')} backLabel={t('action.close')} icon="close" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <T variant="title" accessibilityRole="header">
          {t('settings.title')}
        </T>

        <View style={{ marginTop: 12 }}>
          <SettingsRow
            title={t('settings.language')}
            hint={t('settings.languageHint')}
            layout="stacked"
            right={chips<LanguageSetting>(
              settings.language,
              [
                { value: 'system', label: t('settings.system') },
                { value: 'en', label: 'EN', a11y: t('settings.english') },
                { value: 'lv', label: 'LV', a11y: t('settings.latvian') },
              ],
              (language) => void update({ language }),
            )}
          />
          <SettingsRow
            title={t('settings.theme')}
            layout="stacked"
            right={chips<ThemeSetting>(
              settings.theme,
              [
                { value: 'system', label: t('settings.system') },
                { value: 'light', label: t('settings.light') },
                { value: 'dark', label: t('settings.dark') },
              ],
              (th) => void update({ theme: th }),
            )}
          />
          <SettingsRow
            title={t('settings.haptics')}
            hint={t('settings.hapticsHint')}
            right={<Toggle value={settings.haptics} onChange={(haptics) => void update({ haptics })} label={t('settings.haptics')} />}
          />
          <SettingsRow
            title={t('settings.favourites')}
            hint={t('settings.favouritesHint')}
            right={<Toggle value={settings.includeFavorites} onChange={(includeFavorites) => void update({ includeFavorites })} label={t('settings.favourites')} />}
          />
          <SettingsRow
            title={t('settings.motion')}
            hint={t('settings.motionHint')}
            right={<Toggle value={settings.reduceMotion} onChange={(reduceMotion) => void update({ reduceMotion })} label={t('settings.motion')} />}
          />
          <SettingsRow
            title={t('settings.short')}
            hint={t('settings.shortHint')}
            layout="stacked"
            right={chips<number>(
              settings.shortVideoMaxSec,
              [15, 30, 60].map((n) => ({ value: n, label: t('settings.shortValue', { count: n }) })),
              (shortVideoMaxSec) => void update({ shortVideoMaxSec }),
            )}
          />
          <SettingsRow
            title={t('settings.access')}
            hint={access === 'limited' ? t('permission.limited') : t('settings.accessHint')}
            right={<Chip label={t('settings.manage')} onPress={() => (access === 'limited' ? void presentLimitedPicker() : void Linking.openSettings())} />}
          />
          <SettingsRow title={t('settings.privacy')} right={link(PRIVACY_URL)} onPress={() => void Linking.openURL(PRIVACY_URL)} />
          <SettingsRow title={t('settings.support')} right={link(SUPPORT_URL)} onPress={() => void Linking.openURL(SUPPORT_URL)} />
          <SettingsRow title={t('settings.reset')} destructive onPress={resetProgress} />
        </View>

        <View style={{ marginTop: 24 }}>
          <Callout title={t('settings.free')}>{t('settings.freeBody')}</Callout>
        </View>
        <T variant="meta" tone="secondary" style={{ textAlign: 'center', marginTop: 20, fontSize: 11 }}>
          {t('app.name')} · {t('app.tagline')}
        </T>
      </ScrollView>
    </Screen>
  );
}
