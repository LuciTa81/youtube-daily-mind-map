# Pre-commit Change Groups

Use this snapshot before staging or committing the current working tree. It groups the current changes into reviewable commit candidates so the repo does not turn one large product change into an unreadable commit.

Snapshot source: `git status --short` on 2026-06-03.

## Product Boundary

- Keep the candidate YouTube-first.
- Keep Android as the primary installed-app surface.
- Keep web as the demo, guide, landing, and shared-report surface.
- Do not add KakaoTalk, Naver, photos, health data, payments, ads, automatic AI calls, cross-device sync, broad Drive search, or server upload of raw personal records without ADR.
- Keep Takeout ZIPs, watch-history records, video titles, URLs, notes, OAuth tokens, Drive tokens, and Drive file names out of logs.

## Current Working Tree Audit - 2026-06-03

Snapshot source: `git status --short`, `git diff --name-only`, and `git ls-files --others --exclude-standard` after the quick-share save mode and Android transition smoke work.

ADR: required and added for optional quick share save mode. The current diff stays inside YouTube-first shared-video save, local settings, Android native completion, quick-share transition polish, and shared-memory review surface work. It does not add broad Drive search, server upload, runtime AI calls, payments, ads, analytics, cross-device sync, overlay permission, or expansion beyond YouTube records.

Current changed files:

- `android/app/src/main/java/com/lucita81/youtubedailymindmap/NativeShareIntentPlugin.java`
- `android/app/src/main/res/values/styles.xml`
- `android/app/src/main/res/anim/quick_share_noop.xml`
- `docs/adr/0006-quick-share-save-mode.md`
- `docs/risks.md`
- `docs/use-cases.md`
- `src/components/layout/AppShell.tsx`
- `src/components/layout/HomeDashboard.tsx`
- `src/components/layout/LeftPanel.tsx`
- `src/lib/native/nativeShareIntent.ts`
- `src/lib/review/buildDailyReview.ts`
- `src/lib/review/memorableItems.ts`
- `src/lib/share/quickShareSave.ts`
- `src/lib/storage/userSettingsRepository.ts`
- `src/tests/androidQuickShareTransitionTheme.test.ts`
- `src/tests/buildDailyReview.test.ts`
- `src/tests/quickShareCompletion.test.ts`
- `src/tests/quickShareSavePolicy.test.ts`
- `src/tests/quickShareSettingsUx.test.ts`
- `src/tests/sharedMemoryHomeUx.test.ts`
- `src/tests/userSettingsRepository.test.ts`
- `docs/checklists/pre-commit-change-groups.md`
- `src/tests/preCommitChangeGroups.test.ts`

Recommended commit grouping:

### Current Group E - Quick Share Save Loop

Purpose: keep the Android share-save loop reviewable as one product slice: opt-in quick-save setting, local persistence, native Toast/return behavior, and launch-transition mitigation.

Stage together:

- `docs/adr/0006-quick-share-save-mode.md`
- `docs/risks.md`
- `docs/use-cases.md`
- `android/app/src/main/java/com/lucita81/youtubedailymindmap/NativeShareIntentPlugin.java`
- `android/app/src/main/res/values/styles.xml`
- `android/app/src/main/res/anim/quick_share_noop.xml`
- `src/lib/native/nativeShareIntent.ts`
- `src/lib/share/quickShareSave.ts`
- `src/lib/storage/userSettingsRepository.ts`
- `src/tests/androidQuickShareTransitionTheme.test.ts`
- `src/tests/quickShareCompletion.test.ts`
- `src/tests/quickShareSavePolicy.test.ts`
- `src/tests/quickShareSettingsUx.test.ts`
- `src/tests/userSettingsRepository.test.ts`

Mixed files that require partial/hunk staging for Current Group E:

- `src/components/layout/AppShell.tsx`
  - Include: user-settings load/save state for `quickShareSaveEnabled`.
  - Include: pending native share consumption after user settings are ready.
  - Include: `shouldCompleteQuickShare(...)`, `getQuickShareCompletionMessage(...)`, and `completeNativeQuickShare(...)` usage.
  - Include: skipping the memory prompt only after the shared video persisted successfully.
  - Exclude: Home review card layout, marked-memory review sections, and daily-review/report display changes.
- `src/components/layout/LeftPanel.tsx`
  - Include: the opt-in quick share save setting and its explanatory copy.
  - Exclude: unrelated import, report, or mobile layout hunks if they appear later.

Verification evidence:

- `npm run test -- src/tests/quickShareCompletion.test.ts src/tests/quickShareSavePolicy.test.ts src/tests/quickShareSettingsUx.test.ts src/tests/userSettingsRepository.test.ts src/tests/androidQuickShareTransitionTheme.test.ts src/tests/preCommitChangeGroups.test.ts`
- `npm run verify`
- `npx cap sync android`
- `android/gradlew assembleDebug`
- Real-device smoke: clean or update install, quick-share setting enabled, YouTube share save, Toast confirmation, return to YouTube, duplicate same-day share skipped.

Staging boundary:

- Do not stage shared-memory Home review display work in Current Group E.
- Do not stage AI calls, transcript fetching, billing, quota storage, analytics, broad Drive access, server upload, overlay permission, or non-YouTube data sources.
- Do not claim watch duration.
- Keep the flow local-first; do not log shared URLs, titles, notes, OAuth tokens, Drive tokens, or Takeout paths.

Suggested commit message:

```text
feat(android): add opt-in quick share save mode
```

### Current Group F - Shared Memory Review Surface

Purpose: keep the daily-review value surface separate from the Android quick-share mechanism. This group makes directly saved/shared videos visible in Home review and report logic without changing native share handling.

Stage together:

- `src/components/layout/HomeDashboard.tsx`
- `src/lib/review/buildDailyReview.ts`
- `src/lib/review/memorableItems.ts`
- `src/tests/buildDailyReview.test.ts`
- `src/tests/sharedMemoryHomeUx.test.ts`

Mixed files that require partial/hunk staging for Current Group F:

- `src/components/layout/AppShell.tsx`
  - Include: passing saved/shared-memory-derived review data into Home surfaces if that hunk is present.
  - Exclude: quick-share native completion, local settings, and Android bridge hunks, because those belong to Current Group E.

Verification evidence:

- `npm run test -- src/tests/buildDailyReview.test.ts src/tests/sharedMemoryHomeUx.test.ts src/tests/preCommitChangeGroups.test.ts`
- `npm run verify`

Staging boundary:

- Do not stage Android native files in Current Group F.
- Do not stage quick-share setting/storage/native-completion files in Current Group F.
- Do not add AI summaries, automatic AI calls, payments, cross-device sync, broad Drive access, or server upload.
- Keep review language on record count and saved records, not watch time.

Suggested commit message:

```text
feat: surface shared memories in daily review
```

### Current Group G - Commit Grouping Checklist Refresh

Purpose: keep the planning document and its guardrail tests aligned with the actual working tree before staging product changes.

Stage together:

- `docs/checklists/pre-commit-change-groups.md`
- `src/tests/preCommitChangeGroups.test.ts`

Verification evidence:

- `npm run test -- src/tests/preCommitChangeGroups.test.ts`
- `npm run verify`

Staging boundary:

- Do not stage product runtime code in Current Group G.
- This can be committed before or after Current Group E/F, but it should stay separate from product behavior unless intentionally included as a planning-only update in the same PR.

Recommended commit order:

1. Current Group G - Commit Grouping Checklist Refresh.
2. Current Group E - Quick Share Save Loop.
3. Current Group F - Shared Memory Review Surface.

Do not commit:

- `tsconfig.tsbuildinfo`
- `.next/`
- `out/`
- `android/app/build/`
- Local screenshots, videos, APKs, signing output, or smoke-only artifacts
- Raw Takeout ZIPs or extracted Takeout folders

## Commit Groups

### Group 1 - Agent Harness, Docs, And CI

Purpose: make the AI-agent harness explicit before adding more product surface.

Candidate files:

- `AGENTS.md`
- `docs/harness.md`
- `docs/architecture.md`
- `docs/use-cases.md`
- `docs/risks.md`
- `docs/adr/TEMPLATE.md`
- `docs/adr/0001-youtube-first-product-boundary.md`
- `docs/adr/0002-android-primary-web-supporting.md`
- `docs/adr/0003-local-first-personal-data.md`
- `docs/checklists/release.md`
- `docs/checklists/pre-release-change-summary.md`
- `docs/checklists/pre-commit-change-groups.md`
- `.github/pull_request_template.md`
- `.github/workflows/quality.yml`
- `eslint.config.mjs`
- `package.json`
- `src/tests/preReleaseChecklist.test.ts`
- `src/tests/preCommitChangeGroups.test.ts`

### Group 1 Stage Candidate Review - 2026-06-03

Decision: stage only the harness, docs, CI, and checklist-test files below for the first reviewable commit. Do not run `git add -A` for this group.

Include in Group 1 staging:

- `AGENTS.md`
- `docs/harness.md`
- `docs/architecture.md`
- `docs/use-cases.md`
- `docs/risks.md`
- `docs/adr/TEMPLATE.md`
- `docs/adr/0001-youtube-first-product-boundary.md`
- `docs/adr/0002-android-primary-web-supporting.md`
- `docs/adr/0003-local-first-personal-data.md`
- `docs/checklists/release.md`
- `docs/checklists/pre-release-change-summary.md`
- `docs/checklists/pre-commit-change-groups.md`
- `.github/pull_request_template.md`
- `.github/workflows/quality.yml`
- `eslint.config.mjs`
- `package.json`
- `src/tests/preReleaseChecklist.test.ts`
- `src/tests/preCommitChangeGroups.test.ts`

Exclude from Group 1 staging:

- `.github/workflows/android-apk.yml`: tracked and unchanged; leave it alone for this group.
- `android/app/src/main/**`: belongs to Android import/share groups.
- `capacitor.config.ts`: belongs to Android and Capacitor packaging guardrails.
- `scripts/smoke-large-takeout.mjs`: belongs to Takeout and Drive import hardening.
- `src/components/**`: belongs to product UI groups.
- `src/lib/**`: belongs to import, share, review, or domain behavior groups.
- `src/tests/fixtures/**`: belongs to Takeout fixture coverage.
- Product behavior tests such as `src/tests/sharedYouTubeVideo.test.ts`, `src/tests/takeoutFixtureFlow.test.ts`, `src/tests/importLoadingOverlay.test.ts`, and `src/tests/capacitorPrivacyConfig.test.ts`.

Suggested manual staging command, if this group is later staged intentionally:

```powershell
git add -- AGENTS.md docs/harness.md docs/architecture.md docs/use-cases.md docs/risks.md docs/adr/TEMPLATE.md docs/adr/0001-youtube-first-product-boundary.md docs/adr/0002-android-primary-web-supporting.md docs/adr/0003-local-first-personal-data.md docs/checklists/release.md docs/checklists/pre-release-change-summary.md docs/checklists/pre-commit-change-groups.md .github/pull_request_template.md .github/workflows/quality.yml eslint.config.mjs package.json src/tests/preReleaseChecklist.test.ts src/tests/preCommitChangeGroups.test.ts
```

Review note: `package.json` is included only because its current diff adds harness scripts such as `typecheck`, `verify`, explicit lint/test/build commands, and the large-Takeout smoke script entry. If dependency or product-runtime changes are added later, split them out before staging Group 1.

### Group 1 Commit Message Draft

Use this message if the staged diff still matches the Group 1 include list:

```text
chore: add agent harness and quality gates

- add agent instructions, architecture, use cases, risks, ADRs, and release checklists
- add CI quality workflow, ESLint flat config, and verify/typecheck scripts
- add checklist tests that keep staged groups and release guardrails visible
```

Final review notes:

- No Android native files should be staged in this commit.
- No product UI files should be staged in this commit.
- No Takeout parser, Drive importer, share-intent, review, or timeline behavior files should be staged in this commit.
- `package.json` should only contain harness-script changes in this commit.
- `git diff --cached --check` should pass before committing this group.

### Group 2 - Takeout And Drive Import Hardening

Purpose: stabilize Takeout parsing, native Drive file access, duplicate handling, failure messaging, and large-file smoke coverage.

Candidate whole files:

- `android/app/src/main/java/com/lucita81/youtubedailymindmap/NativeDriveFilePlugin.java`
- `src/components/import/DriveTakeoutImportPanel.tsx`
- `src/components/import/ImportSummaryCard.tsx`
- `src/components/import/ImportLoadingOverlay.tsx`
- `src/components/import/WatchHistoryImportPanel.tsx`
- `src/lib/drive/googlePicker.ts`
- `src/lib/import/parseTakeout.ts`
- `src/lib/native/nativeDriveFile.ts`
- `scripts/smoke-large-takeout.mjs`
- `src/tests/fixtures/takeoutFixtures.ts`
- `src/tests/importLoadingOverlay.test.ts`
- `src/tests/importResultSummary.test.ts`
- `src/tests/largeTakeoutSmokeScript.test.ts`
- `src/tests/nativeDriveFile.test.ts`
- `src/tests/nativeDriveFilePluginSource.test.ts`
- `src/tests/parseTakeout.test.ts`
- `src/tests/takeoutFixtureFlow.test.ts`
- `src/tests/watchHistoryImportPanelError.test.ts`

Mixed files that require partial/hunk staging:

- `src/types/watch.ts`: include only `WatchHistoryImportSummary`; leave `VideoMemoryTag`, `memoryTag`, `memoryNote`, and `memoryUpdatedAt` for share/review groups.
- `src/components/layout/AppShell.tsx`: include only import-summary application flow and native-import return-home handling; leave YouTube share intent, video memory prompt, and settings safe-area layout hunks for later groups.
- `src/components/layout/LeftPanel.tsx`: include only the import-summary pass-through hunk if `AppShell.tsx` passes `latestImportSummary` into `LeftPanel`; leave any mobile/settings hunks for later groups.
- `src/components/layout/HomeDashboard.tsx`: include only `latestImportSummary` and `ImportSummaryCard` rendering; leave marked video-memory and recall-card hunks for review/share groups.

### Group 2 Stage Candidate Review - 2026-06-03

Decision: stage the whole files above plus only the listed partial hunks from the mixed files. Do not whole-file stage `AppShell.tsx`, `HomeDashboard.tsx`, or `watch.ts` for this group. Whole-file stage `LeftPanel.tsx` only if its diff is still limited to the import-summary pass-through lines below.

Group 2 mixed hunk plan:

- `src/types/watch.ts`
  - Include: the `WatchHistoryImportSummary` type block.
  - Exclude: `VideoMemoryTag`, `memoryTag`, `memoryNote`, and `memoryUpdatedAt`.
- `src/components/layout/AppShell.tsx`
  - Include: `WatchHistoryImportSummary` type import.
  - Include: `buildImportSummary(...)`.
  - Include: `latestImportSummary` state.
  - Include: `handleItemsImported(...)` returning `Promise<WatchHistoryImportSummary>`, creating the summary, setting it, and returning it.
  - Include: clearing `latestImportSummary` when switching to sample data or clearing saved records.
  - Include: passing `latestImportSummary` into `LeftPanel` and `HomeDashboard`.
  - Include: the `youtubeMindMap:goHome` listener only as native-import return-home handling.
  - Exclude: `getDateKeyForItem`, `addNativeShareIntentListener`, `consumePendingNativeShareIntent`, `saveSharedYouTubeVideo`, `applyVideoMemoryDraft`, `SharedMemoryPrompt`, `VideoMemoryTag`, shared-memory state/effects/handlers, `handleVideoMemorySave`, `onVideoMemorySave`, and settings bottom-padding hunks.
- `src/components/layout/LeftPanel.tsx`
  - Include: `WatchHistoryImportSummary` type import.
  - Include: `latestImportSummary` prop and pass-through into `WatchHistoryImportPanel`.
  - Include: `onItemsImported` returning `WatchHistoryImportSummary | Promise<WatchHistoryImportSummary>`.
  - Exclude: any unrelated mobile, settings, import guide, or layout hunk if one appears later.
- `src/components/layout/HomeDashboard.tsx`
  - Include: `ImportSummaryCard` import.
  - Include: `WatchHistoryImportSummary` type import and `latestImportSummary` prop.
  - Include: rendering `<ImportSummaryCard summary={latestImportSummary} />`.
  - Exclude: `getVideoMemorySummary`, video memory badges, `markedMemoryItems`, `markedMemoryItemIds`, and the `오늘 남긴 영상` section.

Partial staging mechanics:

- Do not use `git add` on mixed files until their staged diff is checked against this hunk plan.
- If a desired Group 2 hunk is tangled with a later-group hunk, stage it manually with a temporary patch or leave the mixed file unstaged until the hunk can be split safely.
- After staging, run `git diff --cached --check` and inspect `git diff --cached -- src/types/watch.ts src/components/layout/AppShell.tsx src/components/layout/LeftPanel.tsx src/components/layout/HomeDashboard.tsx`.

Exclude from Group 2 staging:

- `android/app/src/main/AndroidManifest.xml`: belongs to Android YouTube share save loop.
- `android/app/src/main/java/com/lucita81/youtubedailymindmap/MainActivity.java`: belongs to Android YouTube share save loop.
- `android/app/src/main/java/com/lucita81/youtubedailymindmap/NativeShareIntentPlugin.java`: belongs to Android YouTube share save loop.
- `capacitor.config.ts`: belongs to Android and Capacitor packaging guardrails.
- `src/components/share/**`: belongs to Android YouTube share save loop.
- `src/lib/native/nativeShareIntent.ts`: belongs to Android YouTube share save loop.
- `src/lib/share/**`: belongs to Android YouTube share save loop.
- `src/lib/review/**`: belongs to daily and weekly review surfaces.
- `src/components/review/**`: belongs to daily and weekly review surfaces.
- `src/components/timeline/**`: belongs to daily and weekly review surfaces.
- `src/components/mindmap/NodeDetailRenderer.tsx`: belongs to daily and weekly review surfaces.
- `src/components/layout/LeftPanel.tsx`: belongs to mobile/foldable settings polish unless the staged diff is limited to the import-summary pass-through hunk above.
- Product behavior tests such as `src/tests/sharedYouTubeVideo.test.ts`, `src/tests/shareGuideCopy.test.ts`, `src/tests/videoMemory.test.ts`, `src/tests/buildDailyReview.test.ts`, `src/tests/buildWeeklyReport.test.ts`, `src/tests/mobileSettingsLayout.test.ts`, and `src/tests/capacitorPrivacyConfig.test.ts`.

Group 2 verification notes:

- `npm run verify` must pass before staging.
- `git diff --cached --check` must pass after staging.
- Because this group includes Android native Drive code, run `npx cap sync android` and `android/gradlew assembleDebug` before committing it.
- Before release or sharing an APK, repeat real-device Drive import smoke for invalid ZIP rejection, valid fixture completion, duplicate fixture import, and large-file progress visibility.
- Keep Drive access user-selected; do not introduce broad Drive search or raw Takeout server upload.

### Group 3 - Android YouTube Share Save Loop

Purpose: let a user save a YouTube video into today's records from Android sharing, without depending on Takeout.

Candidate files:

- `android/app/src/main/AndroidManifest.xml`
- `android/app/src/main/java/com/lucita81/youtubedailymindmap/MainActivity.java`
- `android/app/src/main/java/com/lucita81/youtubedailymindmap/NativeShareIntentPlugin.java`
- `src/components/share/`
- `src/lib/native/nativeShareIntent.ts`
- `src/lib/share/`
- `src/tests/sharedYouTubeVideo.test.ts`
- `src/tests/shareGuideCopy.test.ts`
- `src/tests/videoMemory.test.ts`
- `src/types/watch.ts`

### Group 3 Stage Candidate Review - 2026-06-03

Decision: stage the Android share-intent loop and immediate shared-video memory prompt. Do not stage daily/weekly review display surfaces for this group.

Whole-file candidates:

- `android/app/src/main/AndroidManifest.xml`: include only the `ACTION_SEND` text/plain intent filter.
- `android/app/src/main/java/com/lucita81/youtubedailymindmap/MainActivity.java`: include only `NativeShareIntentPlugin` registration, cold-start intent handling, and `onNewIntent` handling.
- `android/app/src/main/java/com/lucita81/youtubedailymindmap/NativeShareIntentPlugin.java`
- `src/components/share/SharedMemoryPrompt.tsx`
- `src/lib/native/nativeShareIntent.ts`
- `src/lib/share/sharedYouTubeVideo.ts`
- `src/lib/share/videoMemory.ts`
- `src/tests/sharedYouTubeVideo.test.ts`
- `src/tests/shareGuideCopy.test.ts`
- `src/tests/videoMemory.test.ts`

Mixed files that require partial/hunk staging:

- `src/types/watch.ts`
  - Include: `VideoMemoryTag`.
  - Include: `memoryTag`, `memoryNote`, and `memoryUpdatedAt` on `WatchItem`.
  - Exclude: any future import-summary changes, because `WatchHistoryImportSummary` belongs to Group 2 and is already committed.
- `src/components/layout/AppShell.tsx`
  - Include: `getDateKeyForItem` import for routing a shared video into the selected day.
  - Include: `addNativeShareIntentListener` and `consumePendingNativeShareIntent` imports.
  - Include: `saveSharedYouTubeVideo`, `applyVideoMemoryDraft`, and `SharedMemoryPrompt` imports.
  - Include: `VideoMemoryTag` and `VideoMemoryDraft` usage needed by the immediate share-memory prompt.
  - Include: shared-memory state, pending native-share consumption, native-share listener, same-day duplicate handling, save-to-IndexedDB flow, and share-memory prompt save/dismiss handlers.
  - Include: rendering `<SharedMemoryPrompt ... />`.
  - Exclude: passing `onVideoMemorySave` into `DetailPanel`, because editable detail-panel memory belongs to Group 4.
  - Exclude: settings safe-area bottom-padding hunks, because those belong to Group 5.

Exclude from Group 3 staging:

- `src/components/layout/DetailPanel.tsx`: belongs to daily and weekly review surfaces.
- `src/components/mindmap/NodeDetailRenderer.tsx`: belongs to daily and weekly review surfaces.
- `src/components/layout/HomeDashboard.tsx`: belongs to daily and weekly review surfaces unless a future share-only hunk appears.
- `src/components/review/**`: belongs to daily and weekly review surfaces.
- `src/components/timeline/**`: belongs to daily and weekly review surfaces.
- `src/lib/review/**`: belongs to daily and weekly review surfaces.
- `src/tests/buildDailyReview.test.ts`: belongs to daily and weekly review surfaces.
- `src/tests/buildWeeklyReport.test.ts`: belongs to daily and weekly review surfaces.
- `src/tests/mobileSettingsLayout.test.ts`: belongs to mobile, foldable, and loading polish.
- `capacitor.config.ts`: belongs to Android and Capacitor packaging guardrails.
- `src/tests/capacitorPrivacyConfig.test.ts`: belongs to Android and Capacitor packaging guardrails.
- Takeout and Drive import files already committed in Group 2.

Group 3 verification notes:

- `npm run verify` must pass before staging.
- `git diff --cached --check` must pass after staging.
- Because this group changes Android native share handling, run `npx cap sync android` and `android/gradlew assembleDebug` before committing it.
- Before release or sharing an APK, repeat real-device smoke for YouTube app share chooser visibility, cold-start pending share, warm-app `onNewIntent`, same-day duplicate handling, non-YouTube share rejection, and shared-memory tag/note persistence.
- Keep the feature local-first; do not upload shared URLs, notes, or video titles to a server.
- Do not claim watch duration; shared videos are manual viewing records only.

### Group 4 - Daily And Weekly Review Surfaces

Purpose: move the product value from raw mind-map viewing toward daily recall and weekly review.

Candidate files:

- `src/components/layout/DetailPanel.tsx`
- `src/components/layout/HomeDashboard.tsx`
- `src/components/mindmap/NodeDetailRenderer.tsx`
- `src/components/review/WeeklyReportPanel.tsx`
- `src/components/timeline/WatchTimeline.tsx`
- `src/lib/review/buildDailyReview.ts`
- `src/lib/review/buildWeeklyReport.ts`
- `src/lib/review/memorableItems.ts`
- `src/tests/buildDailyReview.test.ts`
- `src/tests/buildWeeklyReport.test.ts`

### Group 4 Stage Candidate Review - 2026-06-03

Decision: stage the daily and weekly review value surface, including user-marked memory items and editable video notes from the detail panel. Keep mobile settings safe-area padding and Capacitor logging guardrails out of this group.

Whole-file candidates:

- `src/components/layout/DetailPanel.tsx`
- `src/components/layout/HomeDashboard.tsx`
- `src/components/mindmap/NodeDetailRenderer.tsx`
- `src/components/review/WeeklyReportPanel.tsx`
- `src/components/timeline/WatchTimeline.tsx`
- `src/lib/review/buildDailyReview.ts`
- `src/lib/review/buildWeeklyReport.ts`
- `src/lib/review/memorableItems.ts`
- `src/tests/buildDailyReview.test.ts`
- `src/tests/buildWeeklyReport.test.ts`

Mixed files that require partial/hunk staging:

- `src/components/layout/AppShell.tsx`
  - Include: passing `onVideoMemorySave={dataViewMode === "saved" ? handleVideoMemorySave : undefined}` into `DetailPanel`.
  - Exclude: `defaultBottomPaddingClass`, `settingsBottomPaddingClass`, `mainContentClassName`, and replacing the static `<main className="flex-1 px-4 py-4 pb-24 md:px-6">` with `mainContentClassName`, because those belong to Group 5.

Group 4 behavior boundaries:

- Keep `buildDailyReview`, `buildWeeklyReport`, and `memorableItems` as pure domain/report logic in `src/lib`.
- Keep React components responsible only for rendering review surfaces and calling already-provided handlers.
- Do not add AI summaries, automatic AI calls, cross-device sync, payments, broad Drive access, or server upload.
- Do not display watch duration unless true duration data exists.

Exclude from Group 4 staging:

- `src/components/layout/AppShell.tsx` settings safe-area bottom-padding hunks.
- `src/tests/mobileSettingsLayout.test.ts`: belongs to mobile, foldable, and loading polish.
- `capacitor.config.ts`: belongs to Android and Capacitor packaging guardrails.
- `src/tests/capacitorPrivacyConfig.test.ts`: belongs to Android and Capacitor packaging guardrails.
- `docs/checklists/pre-commit-change-groups.md` and `src/tests/preCommitChangeGroups.test.ts`: checklist planning updates; keep them separate from the product behavior commit unless intentionally making a planning-only commit.

Group 4 verification notes:

- Run `npm run verify`.
- Run `git diff --cached --check`.
- Inspect `git diff --cached -- src/components/layout/AppShell.tsx` and confirm only the `onVideoMemorySave` prop hunk is staged from that mixed file.
- Before sharing an APK that includes these web changes, run `npx cap sync android` and `android/gradlew assembleDebug`.
- Smoke test saved-record detail editing: open a saved video, edit tag/note, confirm it appears in the daily review, timeline, and weekly report.

### Group 5 - Mobile, Foldable, And Loading Polish

Purpose: improve installed-app ergonomics on phones and foldables, especially during import.

Candidate files:

- `src/components/import/ImportLoadingOverlay.tsx`
- `src/components/layout/AppShell.tsx`
- `src/components/layout/LeftPanel.tsx`
- `src/tests/importLoadingOverlay.test.ts`
- `src/tests/mobileSettingsLayout.test.ts`

### Group 5 Stage Candidate Review - 2026-06-03

Decision: stage only mobile/foldable layout polish currently left in the working tree. Do not stage daily/weekly review editing or Capacitor logging changes in this group.

Current whole-file candidates:

- `src/tests/mobileSettingsLayout.test.ts`

Mixed files that require partial/hunk staging:

- `src/components/layout/AppShell.tsx`
  - Include: `defaultBottomPaddingClass`.
  - Include: `settingsBottomPaddingClass`.
  - Include: `mainContentClassName`.
  - Include: replacing the static `<main className="flex-1 px-4 py-4 pb-24 md:px-6">` with `<main className={mainContentClassName}>`.
  - Exclude: passing `onVideoMemorySave` into `DetailPanel`, because that belongs to Group 4.

Group 5 exclusions:

- `src/components/layout/DetailPanel.tsx`
- `src/components/layout/HomeDashboard.tsx`
- `src/components/mindmap/NodeDetailRenderer.tsx`
- `src/components/review/WeeklyReportPanel.tsx`
- `src/components/timeline/WatchTimeline.tsx`
- `src/lib/review/**`
- `src/tests/buildDailyReview.test.ts`
- `src/tests/buildWeeklyReport.test.ts`
- `capacitor.config.ts`
- `src/tests/capacitorPrivacyConfig.test.ts`

Group 5 verification notes:

- Run `npm run verify`.
- Run `git diff --cached --check`.
- Inspect `git diff --cached -- src/components/layout/AppShell.tsx` and confirm only the settings bottom-padding hunk is staged from that mixed file.
- On a foldable or narrow Android viewport, smoke test the settings screen so bottom actions are not hidden by the fixed bottom nav.

### Group 6 - Android And Capacitor Packaging Guardrails

Purpose: keep packaging, privacy, and Android bridge configuration reviewable.

Candidate files:

- `capacitor.config.ts`
- `src/tests/capacitorPrivacyConfig.test.ts`

### Group 6 Stage Candidate Review - 2026-06-03

Decision: stage only Capacitor packaging/privacy guardrails. This group is intentionally separate from review UI and mobile layout polish.

Whole-file candidates:

- `capacitor.config.ts`: include `loggingBehavior: "none"`.
- `src/tests/capacitorPrivacyConfig.test.ts`

Group 6 behavior boundaries:

- Keep native bridge logging disabled because import responses and app state can include personal watch-history-derived data.
- Do not add new native plugins, permissions, broad Drive scopes, analytics, AI calls, or server upload in this group.
- Do not stage Android generated build output, APKs, signing output, or debug keystores.

Group 6 verification notes:

- Run `npm run verify`.
- Run `git diff --cached --check`.
- Run `npx cap sync android` and `android/gradlew assembleDebug` because Capacitor config affects the Android package.
- Before release, run `android/gradlew assembleRelease` and inspect logcat for accidental watch-history, title, URL, token, or note logging.

## Resolved Local Cleanup

- `-`: root-level ZIP-like binary fixture. Decision: delete from the workspace and do not commit. It must not be committed under this name. If a ZIP fixture is needed, regenerate it from `src/tests/fixtures/takeoutFixtures.ts` or a named script so reviewers can understand its source.
- `node.cmd`: local Windows Node launcher. Decision: delete from the workspace and do not commit. It can shadow project Node resolution on Windows and force `%ProgramFiles%\nodejs\node.exe`, which conflicts with version-manager and CI expectations. If local `npm run ...` resolves `node` to an inaccessible Codex app resource, fix the shell `PATH` for that session instead of adding a root launcher.

## Needs Decision Before Commit

- Any generated APK, signing output, local debug keystore, or raw Takeout archive must be excluded unless a separate release-artifact process explicitly requires it outside the source commit.

## Do Not Commit

- `.next/`
- `out/`
- `android/app/build/`
- `tsconfig.tsbuildinfo`
- Local raw Takeout ZIPs or extracted Takeout folders
- Personal Drive, OAuth, or picker credentials
- Device screenshots, videos, or APKs produced only for local smoke testing

## Verification Before Commit

- Run `npm run verify` before considering any web, TypeScript, docs-harness, or unit-test group ready.
- In this local Codex Windows shell, prepend the installed Node directory if needed: `$env:PATH = "C:\Program Files\nodejs;$env:PATH"` before running `npm run verify`.
- Run `git diff --cached --check` after staging a group and before committing it.
- Run `npx cap sync android` if web assets, Capacitor config, or native bridge behavior changed.
- Run `android/gradlew assembleDebug` when Android native code changes.
- Run `android/gradlew assembleRelease` before sharing an APK or Play Store candidate.
- Repeat a real-device smoke test when native import, share intent, loading UI, deletion, or APK packaging changes.

## Suggested Commit Order

1. Agent harness, docs, CI, and checklist tests.
2. Takeout and Drive import hardening.
3. Android YouTube share save loop.
4. Daily and weekly review surfaces.
5. Mobile, foldable, and loading polish.
6. Android and Capacitor packaging guardrails.

Keep each group reviewable. If a file belongs to two groups, commit it with the group that explains the behavior change most clearly.
