import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, Switch, View } from 'react-native';
import type { LanguageSetting, ThemeSetting } from '../src/storage';
import { storage } from '../src/state/instances';
import { useLibrary } from '../src/state/library';
import { useQueue } from '../src/state/queue';
import { useSettings } from '../src/state/settings';
import { Screen } from '../src/ui/components/Screen';
import { T } from '../src/ui/components/Text';
import { useTheme } from '../src/ui/theme';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);
  const refresh = useLibrary((s) => s.refresh);
  const loadQueue = useQueue((s) => s.load);

  const resetProgress = () => {
    Alert.alert(t('settings.resetConfirmTitle'), t('settings.resetConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.resetProgress'),
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

  return (
    <Screen padded={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.lg }}>
        <T variant="title" style={{ flex: 1 }}>
          {t('settings.title')}
        </T>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('common.close')}>
          <Ionicons name="close" size={26} color={theme.colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl, gap: theme.spacing.xl }}>
        <Group label={t('settings.language')}>
          <Segmented<LanguageSetting>
            value={settings.language}
            options={[
              { value: 'system', label: t('settings.system') },
              { value: 'en', label: t('settings.english') },
              { value: 'lv', label: t('settings.latvian') },
            ]}
            onChange={(language) => void update({ language })}
          />
        </Group>

        <Group label={t('settings.theme')}>
          <Segmented<ThemeSetting>
            value={settings.theme}
            options={[
              { value: 'system', label: t('settings.system') },
              { value: 'light', label: t('settings.light') },
              { value: 'dark', label: t('settings.dark') },
            ]}
            onChange={(th) => void update({ theme: th })}
          />
        </Group>

        <Group label={t('settings.shortVideoThreshold')}>
          <Segmented<number>
            value={settings.shortVideoMaxSec}
            options={[15, 30, 60].map((n) => ({ value: n, label: t('settings.shortVideoThresholdValue', { count: n }) }))}
            onChange={(shortVideoMaxSec) => void update({ shortVideoMaxSec })}
          />
        </Group>

        <ToggleRow
          label={t('settings.haptics')}
          value={settings.haptics}
          onChange={(haptics) => void update({ haptics })}
        />
        <ToggleRow
          label={t('settings.includeFavorites')}
          help={t('settings.includeFavoritesHelp')}
          value={settings.includeFavorites}
          onChange={(includeFavorites) => void update({ includeFavorites })}
        />

        <Pressable onPress={resetProgress} accessibilityRole="button">
          <View style={{ gap: 4 }}>
            <T variant="label" tone="danger">
              {t('settings.resetProgress')}
            </T>
            <T variant="caption" tone="faint">
              {t('settings.resetProgressHelp')}
            </T>
          </View>
        </Pressable>

        <View style={{ gap: 4, marginTop: theme.spacing.lg }}>
          <T variant="caption" tone="faint">
            {t('app.name')}
          </T>
          <T variant="caption" tone="faint">
            {t('app.tagline')}
          </T>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <T variant="label" tone="faint" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </T>
      {children}
    </View>
  );
}

function Segmented<V extends string | number>({
  value,
  options,
  onChange,
}: {
  value: V;
  options: { value: V; label: string }[];
  onChange: (v: V) => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md, padding: 4, gap: 4 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: theme.radius.sm,
              alignItems: 'center',
              backgroundColor: active ? theme.colors.surface : 'transparent',
            }}
          >
            <T variant="label" tone={active ? 'default' : 'dim'} numberOfLines={1}>
              {o.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

function ToggleRow({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
      <View style={{ flex: 1, gap: 2 }}>
        <T variant="body">{label}</T>
        {help ? (
          <T variant="caption" tone="faint">
            {help}
          </T>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
        thumbColor="#fff"
      />
    </View>
  );
}
