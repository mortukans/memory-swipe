# Memory Swipe — iOS app concept and development plan

Status: proposed product plan, ready to guide implementation. Working name only; naming and availability checks remain open. Prepared 2 October 2026.

## 1. The idea

A free iPhone app that turns photo cleanup into a pleasant way to revisit memories. Choose a month, an album or a random selection, then swipe through your photos and videos. Keep the memories you want and review the rest before deleting them.

Product line: **Rediscover your memories. Make room for new ones.**

The primary experience is enjoying old memories. Storage cleanup is the useful result. The interface should feel calm, quick and personal rather than like a technical storage utility.

Launch business model: free download, no subscription, no ads, no paid swipe limits and no sale of user data. This is the initial policy, not a promise that every possible future feature will remain free forever. Any later business-model change must be communicated clearly.

## 2. Product decisions

| Area | Proposed decision |
| --- | --- |
| Platform | iPhone first; Android and dedicated iPad layout later |
| Account | No required login in version 1; opening the app takes the user to their library |
| Processing | Photo browsing, decisions and progress stay on the device |
| Backend | Supabase retained in the architecture, but not required for the core loop |
| Photo uploads | None; no photos, thumbnails, filenames, album names or EXIF sent to our backend |
| Connectivity | Locally available media works offline; iCloud-only media may need internet |
| Deletion | Queue first, review second, native Photos deletion third |
| Languages | English and Latvian first; system-language selection with manual override |
| Random mode | Unreviewed items in a shuffled session with no repeats in that session |
| Sessions | Suggested batches of 20, 50 or 100 items, plus continue browsing |

The user's original idea includes login. The recommendation is to remove that step from the MVP because there is no essential account feature yet. If accounts are later added, allow the core cleanup experience to continue without signing in.

## 3. User journey

1. **Welcome:** explain the app in one screen: “Keep what matters. Review before deleting.” State that photos are processed on the device.
2. **Photo access:** explain why access is needed, then present the iOS Photos permission request. This is Photos access, not generic access to all phone storage.
3. **Choose a collection:** Random, Months, Albums, Photos or Videos.
4. **Swipe:** right keeps, left marks for deletion. Visible Keep and Remove buttons offer the same actions. Undo reverses the most recent decision. Skip leaves an item unreviewed.
5. **Review:** show a grid of everything marked for deletion. Tapping an item opens it; users can remove individual items from the queue or cancel everything.
6. **Confirm:** clearly state the count and that deletion affects the Photos library. Request deletion through the system API and let iOS present its own confirmation.
7. **Finish:** show reviewed, kept and successfully deleted counts. Offer another collection or finish for now.

Swiping must never immediately delete an asset. “Keep” means a local review decision; it does not duplicate the photo or automatically mark it as a Photos favorite.

## 4. Browsing options

| Collection | Behavior | Priority |
| --- | --- | --- |
| Random memories | Shuffle accessible unreviewed photos and videos; media-type filter available | MVP |
| By month | Group by capture/creation date and year; show review progress | MVP |
| Albums | Browse albums exposed by the Photos APIs, preserving their names | MVP |
| Photos | Photo-only session | MVP |
| Videos | Video-only session with playback controls | MVP |
| Short videos | Proposed duration: under 30 seconds | MVP |
| Long videos | Proposed duration: 30 seconds or more | MVP |
| Favorites protection | Exclude favorites by default, with a clear opt-in to include them | MVP |
| On this day | Same calendar day in past years | Later |
| Screenshots | Dedicated collection if reliable API classification is available | Later |
| Large videos | Rank by verified or clearly estimated size | Later |
| Similar photos / duplicates | Requires separate on-device comparison work | Later |

Duration thresholds are editable product defaults, not iOS categories. Missing dates go into an Unknown date collection; missing video durations do not silently classify as short. Album coverage may differ from the Apple Photos interface. Confirm actual behavior in the technical spike before promising all system or shared albums.

## 5. Screens and visual direction

Five main surfaces: Welcome and permission guidance; Home and collections; Swipe viewer; Deletion review; Settings.

Use large media cards, restrained accent colors, rounded controls and plenty of breathing room. Display photos without cropping by default so decisions are based on the full image. A soft blurred backdrop can fill unused space. Support dark mode and light mode.

On the swipe screen: collection title, date, progress, large photo/video, Undo, Remove, Skip and Keep. Videos start muted with clear play/pause, scrubbing and sound controls. Pause playback when leaving a card. Add subtle optional haptics and respect reduced-motion preferences.

Accessibility requirements: readable Dynamic Type layouts, VoiceOver labels, buttons as alternatives to gestures, sufficient contrast and no action communicated by color alone. No streak penalties or pressure to delete memories.

## 6. iOS permissions and deletion rules

Handle full access, limited access, denial and permission changes in Settings. Limited access is a usable mode: show only available items and explain that counts cover the selected library subset. Provide a route to change the selection or open Settings. Never repeatedly nag for full access.

Deleting from an album through this app means deleting the underlying library asset, not simply removing it from that album. Explain this on review. When iCloud Photos is enabled, deletion can propagate to other devices using the same library. Apple normally retains deleted items in Recently Deleted for 30 days; users can restore them there. Do not claim the app provides recovery after deletion.

Do not promise that deleting immediately frees the displayed amount of device storage. Recently Deleted, optimized iCloud storage and available size metadata make that misleading. MVP reports counts; any later byte estimate must be labeled an estimate and distinguish selected media size from actual space reclaimed.

Revalidate queued assets before committing deletion. If the user cancels, an asset is unavailable or deletion fails, retain unresolved queue entries and show the true result. Do not mark the entire batch successful before reconciliation.

## 7. Technical architecture

**User-selected stack:** Expo SDK 57, React Native, TypeScript, Supabase, GitHub Actions macOS runner, Fastlane, App Store Connect API and TestFlight. User reports App Store Connect is already connected; credentials and signing configuration have not been inspected in this planning task.

Use Expo Router for navigation, SDK-compatible expo-media-library for Photos access, expo-image for image display, expo-video for playback, expo-localization plus i18next/react-i18next for translations, expo-sqlite for durable local progress and React Native Gesture Handler/Reanimated for the swipe interaction. Install Expo packages through `npx expo install` and lock dependencies.

SDK 57 has a new class-based media-library API. Build an adapter around its Asset, Album and Query APIs rather than spreading Photos calls across screens. Consult SDK 57 documentation instead of assuming examples from older SDKs apply. If a required iOS feature is absent, use an Expo native module/config plugin; this remains compatible with cloud macOS builds but needs a development build.

Suggested modules:

- `media`: authorization, asset queries, album access, preview resolution and deletion.
- `collections`: months, duration filters, random ordering and progress calculation.
- `review`: session state machine, keep/remove/skip/undo and review queue.
- `storage`: SQLite persistence and schema migrations.
- `i18n`: translations, device locale resolution and date/number formatting.
- `ui`: accessible cards, controls, collection tiles and result screens.
- `backend`: optional Supabase client, isolated from core photo functionality.

### Local data

| Entity | Stored fields |
| --- | --- |
| Asset review | Local asset identifier, decision, decision timestamp, asset modification marker |
| Session | Session identifier, collection/filter, ordering seed, cursor and status |
| Pending deletion | Session identifier, asset identifier and pending/result state |
| Settings | Language override, theme, haptics, favorite protection and video threshold |

Asset identifiers are device-local references, not universal cross-device keys. Do not upload them for naive syncing. On app resume, reconcile library changes and invalidate stale references or review decisions where appropriate. Reset progress clears app decisions only and never deletes media.

### Performance

Page metadata queries; do not load full-resolution media for the entire library. Build a lightweight local index incrementally, render the current card and prefetch a small number of previews. Show useful UI before indexing completes. Use bounded thumbnail caches and release inactive video players.

Random sessions should use a shuffled local identifier index or a documented sampling strategy. Do not repeatedly fetch the first page and call it random. Avoid full-library synchronous work on the JavaScript thread.

iCloud-backed items need a loading state, a retry and a skip option. Do not download every original just to count or sort collections. If a preview or native bridge is needed for Live Photos, handle it explicitly; never mistake a Live Photo for two independently deletable assets.

## 8. Supabase and the free model

The core app does not require our servers to hold users' photo libraries. More users mainly increase distribution/support costs, rather than photo storage and per-swipe backend costs. Apple developer membership and CI usage still have operational costs; free to users does not mean free to operate.

MVP: no mandatory Supabase requests, accounts, media buckets or cloud progress sync. Supabase can later support opt-in feedback, optional accounts or a small public configuration document. Cache configuration, use safe local defaults and keep cleanup working if Supabase is unreachable or its quota is exhausted.

If authentication is added, use proper per-user authorization/RLS and never embed service-role credentials. Add account deletion and define retention before launch. Do not collect analytics or crash data until the actual fields, recipients and disclosures have been reviewed. Logs must exclude photo content and identifying media metadata.

## 9. Multilingual behavior

Follow the device/app preferred language where supported; fall back to English. Allow “System default,” English and Latvian in Settings. Match regional variants sensibly and format month names, dates and counts through locale-aware formatters.

All visible text goes through translation keys, including empty states, error messages, permission explanations, accessibility labels and review warnings. Localize native Photos permission descriptions through iOS configuration. Additional languages can be added without changing screen logic, but each needs actual translation and layout QA.

## 10. Build and distribution without owning a Mac

Use a physical iPhone and development/TestFlight builds for real Photos testing. Cloud macOS runners supply Xcode; Expo Go and browser mocks are not sufficient release validation.

Pipeline: pull request checks → approved release workflow → Expo prebuild/native generation → CocoaPods → signed Fastlane archive → upload to TestFlight via App Store Connect API → Apple processing → tester distribution → manual App Store release decision.

Use SDK-compatible Node, Ruby, CocoaPods and Xcode versions pinned in CI. Provision signing certificates/profiles through a chosen secure approach such as Fastlane match; the App Store Connect API key alone does not replace signing materials. Store secrets in protected GitHub environments and keep signing/upload secrets away from untrusted pull requests. Use unique build numbers.

Playwright can produce early UI mockups and web screenshots. Final App Store screenshots should represent the actual iOS app; capture them from an iOS simulator on the macOS runner with seeded sample media and suitable tooling. Maintain a clearly labeled mock media adapter for web previews and a real Photos adapter for iOS.

GitHub Pages can host privacy, terms and support pages. Chrome automation is optional for App Store Connect tasks the API/Fastlane cannot cover. No scrapers or external content feeds are needed.

## 11. Implementation phases

| Phase | Work | Exit condition |
| --- | --- | --- |
| 0 — technical spike | SDK 57 development build, permissions, album queries, photo/video previews, iCloud behavior, batch delete and signing | Works on a physical iPhone, including cancellation and limited access |
| 1 — core experience | Home, months, albums, random sessions, swipe/buttons, undo, review and local persistence | User can complete a safe session and resume after restarting |
| 2 — product polish | Duration filters, favorite protection, translations, accessibility, themes and performance | Comfortable on a large test library with no uncontrolled media downloads |
| 3 — beta | CI TestFlight delivery, real-device QA, permission/deletion edge cases and tester feedback | No unresolved data-loss or false-success bugs |
| 4 — release | Actual screenshots, app description, accurate privacy declarations, policy/support pages and review notes | Release candidate and App Store submission materials complete |

Build a small reliable version before adding duplicates, AI organization, compression, cross-device sync or sharing. Estimates should follow the technical spike, especially album/iCloud behavior and signing setup.

## 12. Acceptance checks

- Swipe left changes only app state until the review flow is confirmed.
- Undo restores the prior state; session restart does not silently discard pending decisions.
- An asset reviewed in one collection is consistently reflected in overlapping collections.
- Deletion cancellation, failed operations and external library changes never produce false success counts.
- Limited permission, denied permission, revoked access and an empty library all have usable states.
- Offline local photos work; unavailable cloud items can be skipped without blocking a session.
- Random sessions do not repeat assets; month grouping separates years correctly.
- Boundary durations, missing dates, large videos, favorites and Live Photos are handled intentionally.
- English/Latvian, larger text, VoiceOver and reduced motion work through the entire flow.
- No user media or identifying media metadata reaches our backend or logs.
- Core browsing still works when optional backend services fail.

Use unit tests for collection filtering and review state transitions, plus integration/manual real-iPhone tests for permissions, Photos changes and deletion. Seed simulator libraries with non-sensitive fixtures for repeatable UI checks.

## 13. Remaining choices

Defaults in this plan allow implementation to proceed. Confirm later: final name/icon, exact visual direction, initial translation list, short-video threshold, favorite behavior and whether optional login has a real feature to support. Validate the minimum iOS version against SDK 57/native dependencies before setting store requirements.

Immediate next task: implement the Phase 0 spike in a repository using the existing build infrastructure. This document is a plan; no app repository, credentials, backend deployment or store listing was changed.

## Official technical references

- Expo SDK 57 release: https://expo.dev/changelog/sdk-57
- SDK 57 MediaLibrary API: https://docs.expo.dev/versions/v57.0.0/sdk/media-library/
- Apple Photos deletion and Recently Deleted: https://support.apple.com/en-us/104967
- Fastlane TestFlight upload: https://docs.fastlane.tools/actions/upload_to_testflight/

References checked during planning. Recheck SDK and store requirements at implementation/release time.
