# Memory Swipe

Rediscover your memories. Make room for new ones.

A free iPhone app that turns photo cleanup into a pleasant way to revisit memories.
Swipe through your photos and videos: right to keep, left to set aside for deletion.
Nothing is ever deleted by a swipe — you review everything and confirm first, and the
system Photos deletion dialog always has the final say.

Everything happens on device. No accounts, no uploads, no network for the core loop.

## Status

MVP of the core experience is built and verified in the browser (web mock of the Photos
library): onboarding + permission, home with collections (random, photos, videos, short/
long videos, months, albums), the swipe loop (keep / remove / skip / undo), the deletion
review grid with warnings, the confirmed delete flow, the result screen, and settings
(language, appearance, short-video threshold, haptics, favorite protection, reset
progress). English + Latvian, light + dark.

Next: a real-device TestFlight build to validate live Photos access, video playback and
safe deletion on iPhone (the Phase 0 spike).

## Stack

- Expo SDK 57, React Native 0.86, TypeScript, Expo Router
- expo-media-library (SDK 57 class API), expo-video, expo-image
- expo-sqlite for durable local review decisions
- Zustand state, i18next (en/lv), Reanimated + Gesture Handler for the swipe
- No backend. Supabase is intentionally out of the MVP.

## Architecture

Pure, unit-tested core, isolated from native:

- `src/media` — the only seam to the Photos library. `MediaItem`/`MediaPreview` are
  serialisable; live native `Asset` handles never escape this folder. Native adapter +
  web mock (`adapter.web.ts`) selected by platform.
- `src/collections` — month grouping, duration classification, favorite protection,
  seeded shuffle (so random sessions are repeatable and resumable), progress.
- `src/review/machine.ts` — the review state machine (keep/remove/skip/undo, the delete
  queue, `markDeleted` that never reports a false success). Pure reducer.
- `src/storage` — durable local store (SQLite on device, in-memory on web/tests).
- `src/state` — Zustand stores tying it together: settings, library, session, queue.
- `app/` — Expo Router screens.

## Develop

```bash
npm install
npm run typecheck
npm test
npx expo start --web   # UI preview with sample data (no real photos)
```

Real Photos access, video playback and deletion only work in a development or TestFlight
build on a physical iPhone — not Expo Go, not web.

## Privacy

No photo content, filenames, album names or EXIF ever leaves the device or reaches any
server or log. Only keep/delete decisions and settings are stored, locally.
