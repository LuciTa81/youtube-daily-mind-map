# Pre-commit Change Groups

Use this snapshot before staging or committing the current working tree. It groups the current changes into reviewable commit candidates so the repo does not turn one large product change into an unreadable commit.

Snapshot source: `git status --short` on 2026-06-03.

## Product Boundary

- Keep the candidate YouTube-first.
- Keep Android as the primary installed-app surface.
- Keep web as the demo, guide, landing, and shared-report surface.
- Do not add KakaoTalk, Naver, photos, health data, payments, ads, automatic AI calls, cross-device sync, broad Drive search, or server upload of raw personal records without ADR.
- Keep Takeout ZIPs, watch-history records, video titles, URLs, notes, OAuth tokens, Drive tokens, and Drive file names out of logs.

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

Candidate files:

- `android/app/src/main/java/com/lucita81/youtubedailymindmap/NativeDriveFilePlugin.java`
- `src/components/import/DriveTakeoutImportPanel.tsx`
- `src/components/import/ImportSummaryCard.tsx`
- `src/components/import/WatchHistoryImportPanel.tsx`
- `src/lib/drive/googlePicker.ts`
- `src/lib/import/parseTakeout.ts`
- `src/lib/native/nativeDriveFile.ts`
- `scripts/smoke-large-takeout.mjs`
- `src/tests/fixtures/takeoutFixtures.ts`
- `src/tests/importResultSummary.test.ts`
- `src/tests/largeTakeoutSmokeScript.test.ts`
- `src/tests/nativeDriveFile.test.ts`
- `src/tests/nativeDriveFilePluginSource.test.ts`
- `src/tests/parseTakeout.test.ts`
- `src/tests/takeoutFixtureFlow.test.ts`
- `src/tests/watchHistoryImportPanelError.test.ts`

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

### Group 5 - Mobile, Foldable, And Loading Polish

Purpose: improve installed-app ergonomics on phones and foldables, especially during import.

Candidate files:

- `src/components/import/ImportLoadingOverlay.tsx`
- `src/components/layout/AppShell.tsx`
- `src/components/layout/LeftPanel.tsx`
- `src/tests/importLoadingOverlay.test.ts`
- `src/tests/mobileSettingsLayout.test.ts`

### Group 6 - Android And Capacitor Packaging Guardrails

Purpose: keep packaging, privacy, and Android bridge configuration reviewable.

Candidate files:

- `capacitor.config.ts`
- `src/tests/capacitorPrivacyConfig.test.ts`

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
