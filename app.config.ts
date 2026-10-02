import type { ConfigContext, ExpoConfig } from 'expo/config';

// On-device name + bundle id. The App Store listing name is set in App Store Connect.
const APP_NAME = 'Memory Swipe';
const BUNDLE_ID = 'com.mortukans.memoryswipe';

// Why we ask for Photos access (English). The Latvian version lives in locales/lv.json
// and is wired through `locales` below into lv.lproj/InfoPlist.strings.
const PHOTOS_USAGE =
  'Memory Swipe shows your photos and videos so you can revisit them and choose what to keep. ' +
  'Deleting always goes through the iOS Photos confirmation, and nothing ever leaves your device.';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_NAME,
  slug: 'memory-swipe',
  scheme: 'memoryswipe',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  locales: { en: './locales/en.json', lv: './locales/lv.json' },
  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: false,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      CFBundleAllowMixedLocalizations: true,
      CFBundleLocalizations: ['en', 'lv'],
    },
    // App-level privacy manifest: no tracking, nothing collected. The accessed-API
    // reasons cover what the dependencies touch (UserDefaults, file timestamps via
    // SQLite/Photos, disk space, boot time) so Xcode's Privacy Report is complete.
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyCollectedDataTypes: [],
      NSPrivacyAccessedAPITypes: [
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults', NSPrivacyAccessedAPITypeReasons: ['CA92.1'] },
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp', NSPrivacyAccessedAPITypeReasons: ['C617.1', '0A2A.1'] },
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace', NSPrivacyAccessedAPITypeReasons: ['E174.1', '85F4.1'] },
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime', NSPrivacyAccessedAPITypeReasons: ['35F9.1'] },
      ],
    },
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: { backgroundColor: '#F5F2E9', foregroundImage: './assets/icon.png' },
  },
  web: { favicon: './assets/favicon.png', bundler: 'metro' },
  plugins: [
    'expo-router',
    ['expo-localization', { supportedLocales: ['en', 'lv'] }],
    'expo-sqlite',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#F5F2E9',
        image: './assets/splash-icon.png',
        imageWidth: 180,
        dark: { backgroundColor: '#202720', image: './assets/splash-icon.png' },
      },
    ],
    // Read + delete access to the Photos library. We never save/add photos, so the
    // "add" purpose string is removed; we present our own limited-access picker.
    [
      'expo-media-library',
      {
        photosPermission: PHOTOS_USAGE,
        savePhotosPermission: false,
        isAccessMediaLocationEnabled: false,
        preventAutomaticLimitedAccessAlert: true,
      },
    ],
    ['expo-video', { supportsBackgroundPlayback: false, supportsPictureInPicture: false }],
  ],
  experiments: { typedRoutes: true },
});
