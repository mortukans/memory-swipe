import { useTranslation } from 'react-i18next';
import { Alert, Linking, ScrollView, View } from 'react-native';
import type { LanguageSetting, ThemeSetting } from '../src/storage';
import { storage } from '../src/state/instances';
import { useLibrary } from '../src/state/library';
import { useQueue } from '../src/state/queue';
import { useSettings } from '../src/state/settings';
import { Callout } from '../src/ui/components/Callout';
import { Chip } from '../src/ui/components/Chip';
import { Screen } from '../src/ui/components/Screen';
import { SettingsRow } from '../src/ui/components/SettingsRow';
import { T } from '../src/ui/components/Text';
import { Toggle } from '../src/ui/components/Toggle';
import { TopBar } from '../src/ui/components/TopBar';

/** Settings: small details, your way. Reset clears decisions only, with confirmation. */
export default function SettingsScreen() {
  const { t } = useTranslation();
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
            await refresh();
            await loadQueue();
          })();
        },
      },
    ]);
  };

  const chips = <V extends string | number>(value: V, opts: { value: V; label: string }[], onChange: (v: V) => void) => (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {opts.map((o) => (
        <Chip key={String(o.value)} label={o.label} selected={o.value === value} onPress={() => onChange(o.value)} />
      ))}
    </View>
  );

  return (
    <Screen>
      <TopBar eyebrow={t('settings.eyebrow')} backLabel={t('action.close')} />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <T variant="title">{t('settings.title')}</T>

        <View style={{ marginTop: 12 }}>
          <SettingsRow
            title={t('settings.language')}
            hint={t('settings.languageHint')}
            right={chips<LanguageSetting>(
              settings.language,
              [
                { value: 'system', label: t('settings.system') },
                { value: 'en', label: 'EN' },
                { value: 'lv', label: 'LV' },
              ],
              (language) => void update({ language }),
            )}
          />
          <SettingsRow
            title={t('settings.theme')}
            right={chips<ThemeSetting>(
              settings.theme,
              [
                { value: 'system', label: t('settings.system') },
                { value: 'light', label: t('settings.light') },
                { value: 'dark', label: t('settings.dark') },
              ],
              (theme) => void update({ theme }),
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
          <SettingsRow title={t('settings.reset')} destructive onPress={resetProgress} />
        </View>

        <View style={{ marginTop: 24 }}>
          <Callout title={t('settings.free')}>{t('settings.freeBody')}</Callout>
        </View>
        <T variant="meta" tone="secondary" style={{ textAlign: 'center', marginTop: 20, fontSize: 11 }}>
          {t('app.name')} · Room for more
        </T>
      </ScrollView>
    </Screen>
  );
}
