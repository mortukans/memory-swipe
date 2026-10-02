# Memory Swipe — Room for more

Open **prototype.html** in a browser. No build step, dependencies or internet connection required. Keep the `assets` folder beside it. Desktop: drag cards or use arrow keys. Mobile: drag cards or tap labelled controls. Left rail jumps between screens for review.

## Handoff contents
- prototype.html — editable HTML/CSS/JavaScript interaction reference, not production iOS code.
- DESIGN-HANDOFF.md — visual direction, screen behavior, implementation and accessibility requirements.
- tokens.json — semantic colors, layout and motion constants.
- strings.json — English and Latvian production copy. Prototype translates core controls only; native app should use this complete dictionary.
- assets/*.svg — original editable vector demo memories. Replace with real user photos; do not ship these as personal content.
- MemoryCard.swift — native SwiftUI gesture and card reference. Integrate into the existing app; it is not an Xcode project.
- screens/*.svg — seven editable vector screen designs; import into Figma or another SVG editor.
- screens/*.png — static screen references rendered from those vectors.
- design-board.png — all seven screens together.

SVGs are companion design drawings, not captures of the browser. Browser content has extra controls and responsive layouts.

This is an independent design concept. It does not claim an Apple award or Apple endorsement. Keep Memory Swipe as the product name. “Room for more” is the design theme, not a required rename.

The existing screenshot features are retained: random session, photos, all/short/long videos, albums, monthly browsing, undo, skip, keep, deletion review, language, theme, haptics, favourite protection and progress reset. The prototype uses deterministic demo content and demo counters; it never accesses or deletes real photos. Settings are in-memory. Production must persist preferences and decisions. No login, subscriptions, ads or premium gates are introduced.

Developer sequence: read the handoff, inspect the prototype, implement tokens and card, connect the existing photo library pipeline, implement permission/review states, then validate on actual iPhones. For an existing React Native app, preserve its data layer and translate motion into its animation/gesture system; do not embed the prototype as a WebView UI.
