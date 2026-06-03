# Android Real-device Smoke Test Checklist

Use this checklist before sharing an APK, publishing a Play Store candidate, or merging native Android behavior. It turns the Android smoke step from an ad hoc note into a repeatable release gate.

## Scope

This checklist covers the installed Android app only:

- Native Drive or Android file-picker Takeout import.
- Large Takeout import progress and visible failure states.
- YouTube share intent capture.
- Local deletion or clear-data flow.
- Release APK privacy smoke with logcat.
- Foldable and small-phone layout checks.

It does not replace unit tests, fixture tests, `npm run verify`, or Android builds.

## Preconditions

- [ ] The build target is known: debug APK, locally signed release APK, or Play Store candidate.
- [ ] The signing lane is known: CI debug artifact, local smoke debug artifact, locally smoke-signed release APK, or Play Store candidate.
- [ ] If update-install behavior matters, the APK being installed is signed with the same certificate as the already installed app.
- [ ] CI debug artifacts are treated as clean-install artifacts unless they share the dedicated smoke debug signing certificate with the local smoke build.
- [ ] For a local smoke debug build, `SMOKE_DEBUG_KEYSTORE_FILE`, `SMOKE_DEBUG_KEYSTORE_PASSWORD`, `SMOKE_DEBUG_KEY_ALIAS`, and `SMOKE_DEBUG_KEY_PASSWORD` point to the dedicated smoke debug signing certificate.
- [ ] For a CI smoke debug build, GitHub Actions secrets provide `SMOKE_DEBUG_KEYSTORE_BASE64`, `SMOKE_DEBUG_KEYSTORE_PASSWORD`, `SMOKE_DEBUG_KEY_ALIAS`, and `SMOKE_DEBUG_KEY_PASSWORD`.
- [ ] If those CI secrets are absent, the CI debug artifact is not used to prove update-install behavior.
- [ ] `npm run verify` passed after the latest code changes.
- [ ] `npx cap sync android` ran if web assets, Capacitor config, or native bridge behavior changed.
- [ ] `android/gradlew assembleDebug` passed for debug-device smoke.
- [ ] `android/gradlew assembleRelease` passed before any release APK smoke.
- [ ] The device model, Android version, APK type, app version, and date are recorded.
- [ ] Test data is non-private unless the user explicitly approves testing with their own Takeout file.

## Privacy Guardrails

- [ ] Do not upload raw Takeout archives to a server during smoke testing.
- [ ] Do not paste watch-history contents, video titles, URLs, notes, OAuth tokens, Drive tokens, or Drive file names into logs or public artifacts.
- [ ] When using logcat, filter by app/plugin tags and record only whether private data was absent.
- [ ] For release APKs, confirm the package is not debuggable.
- [ ] For release APKs, confirm native import/share logcat output is silent or contains no personal data.

## Device Matrix

Run the full checklist on at least one primary Android device before sharing an APK. Before public release, repeat the key flows across a small matrix:

- [ ] Samsung foldable or large-screen device.
- [ ] Standard Android phone.
- [ ] At least one device using Google Drive as the file provider.
- [ ] At least one release APK install over a previous install, if update behavior matters.

## Drive And Takeout Import Smoke

### Invalid Or Missing Watch-history ZIP

- [ ] Open the import/settings screen.
- [ ] Launch the Drive or Android file picker.
- [ ] Select a small ZIP that does not contain YouTube watch-history data.
- [ ] Confirm the picker returns to the app.
- [ ] Confirm a visible user-facing error appears within a reasonable time.
- [ ] Confirm saved viewing record count does not increase.
- [ ] Confirm the app remains interactive after rejection.

### Valid Small Fixture ZIP

- [ ] Select a known non-private Takeout fixture containing YouTube watch-history data.
- [ ] Confirm progress shows a current phase instead of a frozen screen.
- [ ] Confirm the import completes with parsed, added, duplicate, and saved counts.
- [ ] Confirm Home, Timeline, and Reports reflect the imported records.
- [ ] Re-import the same fixture.
- [ ] Confirm the duplicate count increases and no duplicate records are added.

### Large Archive Smoke

- [ ] Select the largest available non-private or explicitly approved Takeout archive.
- [ ] Confirm the loading screen appears immediately after picker return.
- [ ] Confirm the progress phase changes over time while exact progress remains honest when heuristic.
- [ ] Confirm the device screen does not go black from app freeze.
- [ ] Confirm cancellation, error, or completion leaves a visible outcome.
- [ ] Confirm the app remains usable after the import attempt.

## YouTube Share Intent Smoke

- [ ] Open a public YouTube video in the installed YouTube app.
- [ ] Tap YouTube Share.
- [ ] If needed, open the Android resolver's More list.
- [ ] Select `YouTube Daily Mind Map`.
- [ ] Confirm the app opens or returns to the foreground.
- [ ] Confirm the shared video is saved into today's records.
- [ ] Confirm the memory prompt appears.
- [ ] Confirm sharing the same video again does not create an unintended duplicate for the same date.

## Local Data And Deletion Smoke

- [ ] Seed at least one imported or shared record.
- [ ] Open settings or the relevant data-management screen.
- [ ] Trigger clear/delete imported data.
- [ ] Confirm a confirmation step appears before deletion.
- [ ] Confirm records are cleared or replaced by sample data as designed.
- [ ] Confirm daily and weekly screens render a meaningful empty or sample state.

## Storage Migration Smoke

Use this when `WatchItem`, saved-memory fields, repository schema, or IndexedDB persistence changes.

- [ ] Start from a build that can access the app's existing `youtube-daily-mind-map` IndexedDB database.
- [ ] Inject a legacy `watch-history` object-store record that has `id`, `items`, and `updatedAt`, but no `schemaVersion`.
- [ ] Include at least one manual/shared record with `memoryTag`, `memoryNote`, and `memoryUpdatedAt`.
- [ ] Launch or reload the app without clearing app data.
- [ ] Confirm the app loads the legacy record instead of falling back to sample-only data.
- [ ] Confirm Home, Timeline, and the video detail or memory prompt still show the migrated shared-memory fields.
- [ ] Trigger one normal save path, such as editing a memory note or importing a small duplicate fixture.
- [ ] Re-open IndexedDB and confirm the `watch-history` record now contains the current schema version.
- [ ] Confirm no watch-history titles, URLs, notes, local paths, or Drive file names were printed to logs while inspecting the migration.

## Layout Smoke

- [ ] Home dashboard is readable on the real device.
- [ ] Timeline and report screens render without clipped primary actions.
- [ ] Import/settings screen keeps destructive actions above the bottom navigation and safe area.
- [ ] Loading, error, and completion overlays fit on the device.
- [ ] Foldable or wide-screen layout does not hide the mind map controls or detail panels.

## Evidence Template

Copy this block into `docs/checklists/pre-release-change-summary.md` after a release smoke run.

```md
## Android Smoke Test Result - YYYY-MM-DD

Device:
APK:
Build commit:

- [ ] `npm run verify` passed.
- [ ] Capacitor sync/build step passed.
- [ ] App launched on the real device.
- [ ] Invalid ZIP rejection surfaced a visible UI error.
- [ ] Valid fixture import completed with expected counts.
- [ ] Duplicate fixture re-import skipped existing records.
- [ ] Large archive progress did not freeze or black-screen the app.
- [ ] YouTube share intent saved a video into today's records.
- [ ] Local deletion/clear-data flow passed.
- [ ] Legacy watch-history storage migration preserved shared-memory fields and rewrote the current schema version, if storage schema changed.
- [ ] Release logcat privacy smoke passed, if using a release APK.
- [ ] Update install passed with `adb install -r`, if update behavior matters.
- [ ] If update install failed with `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, it was recorded as a signing mismatch and no uninstall or clear-data step was run without explicit approval.

Remaining device-specific risks:
-
```

## Go / No-go

Go only when import, share, deletion, layout, and privacy smoke all pass for the intended APK type.

No-go if any of these occur:

- The app freezes or black-screens during import.
- Picker return leaves the user without a visible error, completion, or cancellable loading state.
- Duplicate imports create duplicate viewing events.
- Release logcat exposes private watch-history data, URLs, notes, tokens, file names, or local paths.
- The app claims viewing duration without real duration data.
