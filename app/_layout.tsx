import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { applyLanguage, initI18n } from '../src/i18n';
import { useLibrary } from '../src/state/library';
import { useSettings } from '../src/state/settings';
import { useTheme } from '../src/ui/theme';

// Initialise i18n immediately so the very first render has translations.
initI18n('system');

function Bootstrap({ children }: { children: React.ReactNode }) {
  const loadSettings = useSettings((s) => s.load);
  const settingsReady = useSettings((s) => s.ready);
  const language = useSettings((s) => s.settings.language);
  const checkAccess = useLibrary((s) => s.checkAccess);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    void (async () => {
      await loadSettings();
      await checkAccess();
      setBooted(true);
    })();
  }, [loadSettings, checkAccess]);

  useEffect(() => {
    applyLanguage(language);
  }, [language]);

  const t = useTheme();
  if (!booted || !settingsReady) return <View style={{ flex: 1, backgroundColor: t.colors.bg }} />;
  return <>{children}</>;
}

export default function RootLayout() {
  const t = useTheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={t.dark ? 'light' : 'dark'} />
        <Bootstrap>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: t.colors.bg },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
            <Stack.Screen name="swipe" />
            <Stack.Screen name="session-end" options={{ animation: 'fade' }} />
            <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
          </Stack>
        </Bootstrap>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
