import { Redirect, Tabs } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueue } from '../../src/state/queue';
import { useSettings } from '../../src/state/settings';
import { CapsuleNav } from '../../src/ui/components/CapsuleNav';
import { useTheme } from '../../src/ui/theme';

/** Discover · Library · Review behind the bottom capsule. First run goes to Welcome. */
export default function TabsLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  const ready = useSettings((s) => s.ready);
  const onboarded = useSettings((s) => s.settings.onboarded);
  const pending = useQueue((s) => s.ids.length);
  const loadQueue = useQueue((s) => s.load);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  if (ready && !onboarded) return <Redirect href="/welcome" />;

  return (
    <Tabs
      tabBar={(props) => (
        <CapsuleNav
          routes={props.state.routes.map((r) => ({
            key: r.key,
            name: r.name,
            title: props.descriptors[r.key]?.options.title ?? r.name,
          }))}
          activeIndex={props.state.index}
          pendingCount={pending}
          pendingHint={pending > 0 ? t('a11y.queued', { count: pending }) : undefined}
          onPress={(route, focused) => {
            const e = props.navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !e.defaultPrevented) props.navigation.navigate(route.name);
          }}
        />
      )}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: theme.colors.bg } }}
    >
      <Tabs.Screen name="index" options={{ title: t('nav.discover') }} />
      <Tabs.Screen name="library" options={{ title: t('nav.library') }} />
      <Tabs.Screen name="review" options={{ title: t('nav.review') }} />
    </Tabs>
  );
}
