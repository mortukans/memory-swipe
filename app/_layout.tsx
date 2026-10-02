import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { applyLanguage, initI18n } from '../src/i18n';
import { useLibrary } from '../src/state/library';
import { useSettings } from '../src/state/settings';
import { useMotion, useTheme } from '../src/ui/theme';

// Initialise i18n immediately so the very first render has translations.
initI18n('system');

function Bootstrap({ children }: { children: React.ReactNode }) {
  const loadSettings = useSettings((s) => s.load);
  const settingsReady = useSettings((s) => s.ready);
  const language = useSettings((s) => s.settings.language);
  const checkAccess = useLibrary((s) => s.checkAccess);
  const watch = useLibrary((s) => s.watch);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    void (async () => {
      await loadSettings();
      await checkAccess();
      setBooted(true);
    })();
  }, [loadSettings, checkAccess]);

  // Re-index when the Photos library changes (limited-selection edits, external deletes).
  useEffect(() => watch(), [watch]);

  useEffect(() => {
    applyLanguage(language);
  }, [language]);

  const t = useTheme();
  if (!booted || !settingsReady) return <View style={{ flex: 1, backgroundColor: t.colors.bg }} />;
  return <>{children}</>;
}

export default function RootLayout() {
  const t = useTheme();
  const { reduce } = useMotion();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={t.dark ? 'light' : 'dark'} />
        <Bootstrap>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: t.colors.bg },
              animation: reduce ? 'fade' : 'slide_from_right',
              animationDuration: reduce ? 150 : undefined,
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
            {/* Discover → Swipe: the print "arrives" — a soft fade-up (420ms) instead of a stock slide. */}
            <Stack.Screen name="swipe" options={{ animation: reduce ? 'fade' : 'fade_from_bottom', animationDuration: reduce ? 150 : 420 }} />
            <Stack.Screen name="session-end" options={{ animation: 'fade', animationDuration: reduce ? 150 : 450 }} />
            <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
          </Stack>
        </Bootstrap>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
