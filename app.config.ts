import type { ConfigContext, ExpoConfig } from 'expo/config';

// Working name + bundle id. Both are placeholders until the final name is chosen;
// changing them is a find-replace here plus the native scheme/slug below.
const APP_NAME = 'Memory Swipe';
const BUNDLE_ID = 'com.mortukans.memoryswipe';

// Why we ask for Photos access. Shown in the iOS permission dialog. Localised copies
// (lv) are supplied through InfoPlist.strings once CFBundleLocalizations is wired up.
const PHOTOS_USAGE =
  'Memory Swipe shows your photos and videos so you can revisit them and choose which to keep. ' +
  'Deleting always goes through the system Photos confirmation. Nothing ever leaves your device.';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_NAME,
  slug: 'memory-swipe',
  scheme: 'memoryswipe',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: false,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      CFBundleAllowMixedLocalizations: true,
      CFBundleLocalizations: ['en', 'lv'],
    },
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: { backgroundColor: '#0E0F13', foregroundImage: './assets/icon.png' },
  },
  web: { favicon: './assets/favicon.png', bundler: 'metro' },
  plugins: [
    'expo-router',
    'expo-localization',
    'expo-sqlite',
    ['expo-splash-screen', { backgroundColor: '#0E0F13', image: './assets/splash-icon.png', imageWidth: 180 }],
    // Read + delete access to the Photos library. We never save/add photos.
    ['expo-media-library', { photosPermission: PHOTOS_USAGE, isAccessMediaLocationEnabled: false }],
    ['expo-video', { supportsBackgroundPlayback: false, supportsPictureInPicture: false }],
  ],
  experiments: { typedRoutes: true },
});
