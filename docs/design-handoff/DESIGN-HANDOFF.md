# Memory Swipe / Room for more

## Design intent
A personal photo collection, not a storage dashboard. Warm paper, ink typography, light physical prints and one crisp lime accent. A small terracotta mark adds character. Motion expresses decisions: a kept photo settles toward the right; a removed photo moves left into a reversible queue. No confetti, streak anxiety, paywalls or pressure to clean an entire library.

The visual signature is the floating print stack and the session ribbon. Three slightly imperfect prints form the discovery hero. Each decision adds one segment to the ribbon: sage for keep, terracotta for remove, outlined/neutral for skip in production. It records a session, not a score.

## Screen inventory and navigation
| Screen | Main content | Main action | Exit / secondary |
|---|---|---|---|
| Welcome | Photo access explanation; original print stack | Request photo access | Not now; retry later |
| Discover | Editorial headline; shuffle hero; media entry points | Random session of up to 20 unreviewed eligible assets | Library, Review, Settings |
| Library | Media filters; monthly chapters with thumbnail + progress; albums | Start selected scope | Back; filter; month/year chooser |
| Swipe | Single fitted photo; optional date/location metadata; ribbon | Keep / Remove | Undo, Skip, Review, back |
| Review | Selected asset grid; actual or explicitly estimated size; restore control | Delete selected items | Keep all, restore individual, back |
| Session end | Kept count; pending count; gentle completion copy | Review choices | Return home; another session |
| Settings | Language; theme; haptics; favorites; motion; short-video threshold; access | Adjust preference | Confirm reset; dismiss |

Photo content must use aspect-fit during review. Never crop the image that the user is deciding about. Album cover thumbnails may crop. No file paths, Photos identifiers, debug text or implementation labels in user-facing views. The original screenshots show file-path overlays; remove them from release builds.

## Visual system
Use SF Pro through system typography. No font download. Use system SF Symbols in the native app; the browser's text icons are schematic placeholders. Hero headline 52pt regular, tracking −2pt, line height 54pt at default content size. Section title 34pt regular; body 16pt; primary labels 16pt semibold; metadata 12–13pt; eyebrow 11pt semibold. Respect Dynamic Type; eyebrow tracking must not impair readability.

Base spacing: 4pt. Page inset 20pt. Default control height at least 44pt. Primary CTA 56pt minimum, corner radius 22pt. Round secondary controls 44pt. Session actions 60pt visual target with visible text labels. Cards 11pt radius, paper border 10pt, caption inset 16pt. Tile radius 20pt. Navigation capsule radius 28pt. Use native safe areas; screenshot status bars and device frame are presentation chrome, not app views.

Light: background #F5F2E9; main text #242A25; secondary #697068; paper #FFFEF8; lime #D8ED91; destructive #C04E31. Dark: background #202720; main text #F3F1E7; secondary #B6BEAC; paper #36402F. Destructive color never doubles as a decorative primary CTA. Verify contrast for all semantic combinations; text on lime is ink. Do not place white text on lime.

Navigation is a three-item bottom capsule: Discover, Library, Review. Use an accessible current-selection indication and a count for pending review. On small screens, increase available scrolling room above navigation. Use native iOS tab semantics if a custom capsule harms accessibility.

## Motion contract
| Interaction | Duration / curve | Behavior | Reduced motion |
|---|---|---|---|
| Discovery prints | 7s ease-in-out, staggered | Vertical drift ±3.5pt only; pause offscreen | Static prints |
| Discover → Swipe | 420ms spring, damping 0.86 | Hero front print shares geometry into review card | 150ms crossfade |
| Drag | Direct manipulation | x follows finger; rotation clamp ±12°; stamp opacity clamp abs(x)/90 | Translation without tilt |
| Commit | 220–280ms ease-out | Fly beyond edge; next card comes from 98% to 100% | 120ms crossfade |
| Snap back | 300ms spring, damping 0.8 | Return to centered pose | Immediate |
| Undo | 300ms spring | Restore exact prior asset and queue state | 120ms crossfade |
| Ribbon update | 180ms ease-out | Segment grows in place; no full ribbon reflow bounce | Immediate |
| Review sheet | Native sheet transition | Confirmation stays distinct from card gesture | Native reduced-motion behavior |
| Session end | 450ms spring | Single orbital accent settles; count appears once | Static summary |

Suggested gesture commit: horizontal translation ≥85pt OR projected horizontal end translation ≥120pt with clear horizontal intent. Ignore vertical scroll intent. Prevent duplicate commits while animating. Cancelled touch returns card to origin. Keep all actions available as buttons; gestures are never mandatory. Trigger one light haptic only when crossing the threshold, latch until below threshold; one soft confirmation on commit. No haptic for every drag frame. Respect disabled haptics.

Prototype implements drift, drag, rotation, stamps, snapback, exit, queue, undo and confirmation. Shared geometry, projected-velocity threshold, haptic latching and native sheets are production requirements, not represented fully in browser. The SwiftUI sample supplies projected threshold and reduced-motion treatment but needs app-specific haptic wiring.

## Data and media integration
Keep the existing app’s PhotoKit or equivalent data pipeline. Asset identity must be stable across sessions. Persist decision records by asset ID, scope and review state; never by shuffled position. A skip is deferred, not silently treated as keep. Favorites are excluded by default. Including Favorites requires an explicit preference; mark them visibly in review. Exclude assets already queued across all categories.

Session size min(20, eligible assets). Show actual progress denominator, never a fictional 20 when fewer are available. Random selection should sample across the selected scope; persist the current order so an interruption resumes correctly. Album/month selection must use actual library metadata. Photos, all videos, short videos and long videos must use non-overlapping threshold semantics: short duration ≤ configured threshold; long > threshold. Album favourites must still honor protection.

Request preview sized for the current viewport; prefetch the next two assets and cancel obsolete requests. Do not load full-resolution photos into the swipe stack. iCloud-only content shows a nonblocking download state with retry and skip. Live Photos start as stills and play on explicit press; videos open a native player with scrub/play/pause, duration and mute. Disable conflicting swipe gestures while scrubbing. Accessibility users need equivalent playback controls. Audio must not autoplay.

No account is needed for these local features. Do not upload photos, filenames or metadata for the redesign. Analytics, if introduced later, must be optional and separately specified.

## Deletion and accuracy
A left swipe only queues a candidate. Review grid offers restore-one and keep-all. Restore updates counts immediately. Final delete calls the OS deletion API and handles cancellation, failure and partial completion. Only clear successful IDs after confirmed result. Never show “space freed” just because an item was queued or moved into Recently Deleted. Present “selected size” or “estimated space” until reclaimed space can be established. Originals, edits and iCloud optimization can make byte counts ambiguous; communicate estimates.

Explain iCloud sync effects before deletion. Native Photos retains deleted items in Recently Deleted subject to platform behavior and the user's actions; use “up to 30 days” and do not promise recovery after permanent deletion. App undo restores an uncommitted decision. It must not claim to recover an item already deleted by iOS.

Reset progress is a separate destructive preference action with confirmation: clear decision history, never delete assets. Specify explicitly whether pending candidates are also cleared (this concept clears them).

## Complete state coverage
- Not determined: welcome + request permission after explicit action.
- Denied/restricted: “Photo access is off” + Open Settings; no repeated system prompt loop.
- Limited library: show “Selected photos only” + native manage selection action.
- Empty library: calm empty state; no fictitious counters or disabled mystery buttons.
- Exhausted scope: “You’ve revisited this chapter” + choose another scope; explicit restart.
- Loading: keep layout fixed; paper placeholder + accessible progress description.
- iCloud download failure: retry / skip; preserve queue and position.
- Asset removed outside app: reconcile IDs, skip missing assets, update denominator.
- App backgrounded: persist completed decision before advancing; pause video and motion.
- Deletion cancelled: remain in review with all candidates preserved.
- Deletion failed: inline error, retry; successful IDs reconciled individually where supported.
- Large library: paginate monthly/album lists; avoid synchronous metadata/size scans on main thread.

## Accessibility and adaptation
Honor system Reduce Motion and app preference. Honor Reduce Transparency by using opaque sheets. Support VoiceOver labels, values and hints for each photo decision; include date, media kind and index. Never announce arbitrary inferred image descriptions as facts. Provide “Keep”, “Remove”, “Skip”, “Undo” actions for the current card. Announce queue count changes succinctly. Restore focus to invoking control after dismissing a sheet; trap focus in browser/native modal equivalents.

Support 320–430pt widths and landscape. At large Dynamic Type sizes, shrink decorative hero first, make layouts scroll and keep bottom controls reachable; never shrink text to fit. Caption must wrap or move below card. Use a neutral background behind images. Dark mode must not recolor photos. Progress uses shape/text as well as color. Validate with VoiceOver, Switch Control, Bold Text, Increase Contrast and sizes through accessibility XXL.

## Release acceptance
1. User can finish random, month, album and video sessions without losing decisions after relaunch.
2. Swipe, labelled buttons and accessibility actions lead to identical queue state.
3. Undo returns exact previous item after keep/remove/skip; no accidental permanent deletion.
4. OS denial, limited access, cancellation and iCloud errors are recoverable.
5. All EN/LV production strings use localization keys; system option follows device language.
6. Appearance supports System/Light/Dark; browser exposes only explicit Light/Dark for preview.
7. Target smooth 60fps on the oldest supported physical iPhone; avoid blur stacks and continuous particles.
8. No paid gates, ads, account wall or misleading storage-reclaimed claims.

Implementation priority: permission/data safety → fitted card/gestures → persistence/review → library filters → motion polish → accessibility/device QA. The supplied concept is a design handoff, not a built App Store release.
