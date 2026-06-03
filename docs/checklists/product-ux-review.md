# Product UX Review - Phone-less Pass

Date: 2026-06-03

This review is a phone-less product UX pass. It uses repository source evidence and existing guard tests only. It does not include a browser screenshot, Android screenshot, or real-device evidence, so it must not be used to justify visual-only CSS changes.

## Scope

- Home daily and weekly memory surface.
- Timeline viewing-record surface.
- Takeout and Drive import surface.
- YouTube share memory visibility.

Out of scope:

- Visual redesign, spacing changes, colors, typography, and layout changes.
- Android native behavior changes.
- AI summary, payments, sync, or any non-YouTube expansion.

## Harness Constraints Applied

- Keep the product YouTube-first and Android-primary.
- Keep Takeout and share data local-first.
- Do not introduce new Drive scopes, AI calls, payments, or server storage.
- Do not claim viewing duration. Use viewing record counts, record counts, or focus time blocks.
- Do not make UI/CSS changes without screen evidence from a 360px to 430px mobile viewport or an explicit follow-up limitation.

## Evidence Used

- `src/components/layout/HomeDashboard.tsx`
  - Uses `review.sharedMemoryItems`, `review.markedMemoryItems`, and `review.memorableItems`.
  - Keeps directly shared YouTube videos separate from passive Takeout records.
  - Shows the latest import summary when available.
  - Provides entry points for Timeline, Mind Map, Weekly Report, and Import.
- `src/components/timeline/WatchTimeline.tsx`
  - Groups viewing records by time block.
  - Shows per-video thumbnails, time, category, channel, and saved memory summary.
  - Uses a mobile vertical timeline and a desktop horizontal timeline.
- `src/components/import/WatchHistoryImportPanel.tsx`
  - Presents Takeout import, native Drive ZIP selection, local file import, sample/saved toggles, and help disclosure.
  - Shows native import outcome states for success, cancellation, and error.
  - States that selected ZIP files are read on the device and not uploaded to a server.
- `src/components/import/DriveTakeoutImportPanel.tsx`
  - Uses Google Picker for one user-selected Drive ZIP on web/PWA.
  - Shows phase labels, progress when known, import result counts, and Drive cleanup action.
- Existing tests:
  - `src/tests/sharedMemoryHomeUx.test.ts`
  - `src/tests/shareGuideCopy.test.ts`
  - `src/tests/watchHistoryImportPanelError.test.ts`
  - `src/tests/importResultSummary.test.ts`
  - `src/tests/importSurfaceDomEvidence.test.ts`

## Surface Review

### Home

What is working:

- The Home surface already separates direct YouTube share memories from Takeout-backed viewing records.
- The Home surface has daily and weekly range controls and routes to Timeline, Mind Map, Weekly Report, and Import.
- Import feedback can appear near the top through the latest import summary.

Risks to validate before visual changes:

- When there are no directly shared memories yet, the share-memory value may be less discoverable.
- The first viewport may become dense after import summary, date range controls, review guide, and stats all render together.
- Korean copy wrapping and card height still need a 360px to 430px browser or Android screenshot pass.

### Timeline

What is working:

- Timeline shows actual local clock time and viewing record order without claiming duration.
- Saved memory tags and notes remain visible on video cards.
- Mobile and desktop layouts are intentionally different, with mobile using a vertical timeline.

Risks to validate before visual changes:

- Directly saved videos are currently visible as memory summaries, but not as a strong filter or section.
- A day with many records may become card-heavy on mobile.
- The horizontal desktop timeline is useful, but mobile should remain the primary review surface for daily recall.

### Import

What is working:

- Import explains the recommended Takeout flow and the YouTube share save flow.
- The primary action changes between native Drive ZIP selection and browser file selection.
- Import result, cancellation, error, duplicate count, and Drive cleanup states have source-level coverage.
- Local-first reassurance sits near the primary import action.
- The web/PWA import panel has source-order evidence that the first file action appears before the Takeout link, help disclosure, and secondary Drive Picker panel.

Risks to validate before visual changes:

- Import is the highest-friction first-run path, so the first action must be unmistakable on a narrow mobile screen.
- The help disclosure may be useful, but it can become a long block if opened on a small screen.
- The web Drive Picker path and native Drive ZIP path should remain clearly distinct to avoid user confusion.
- This pass still has no browser screenshot, Android screenshot, or real-device evidence. It must not justify visual spacing or CSS changes.

## Improvement Candidates

1. Import first-action hierarchy.
   - Goal: make the first-run Takeout path easier to understand without adding more copy.
   - Required evidence before implementation: 390px browser screenshot or Android screenshot of the import panel closed and opened.
   - Do not change CSS from source guesswork alone.

2. Home share-memory discoverability.
   - Goal: make the value of YouTube share save visible even before the user has saved a shared video.
   - Required evidence before implementation: Home first viewport screenshot or DOM text review showing the empty state.
   - Keep Takeout-backed records distinct from direct share memories.

3. Timeline saved-memory scanning.
   - Goal: help users find directly saved or recall-worthy videos faster in long timelines.
   - Required evidence before implementation: mobile timeline screenshot or DOM review of a day with many records.
   - Prefer local filtering or highlighting before adding AI behavior.

## Next Recommended Task

Run a browser-based 390px evidence pass for the Import surface, then improve only the first-action hierarchy if the screenshot or DOM evidence shows that the primary Takeout action is unclear or pushed too far down.
