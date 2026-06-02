# Pre-release Change Summary

Use this document before sharing an APK, pushing production web changes, or asking someone else to test the app. It is a release-readiness snapshot, not a commit log.

## Product Boundary

- The candidate remains a YouTube-first personal memory app.
- Android is the primary installed-app surface.
- Web remains a demo, guide, landing, and shared-report surface.
- Do not expand to KakaoTalk, Naver, photos, health data, payments, ads, automatic AI, or cross-device sync without a separate ADR.

## Current Candidate Scope

- Takeout ZIP import and parsing stability.
- Native/Drive-assisted Takeout file handling.
- Large-import progress and loading screen polish.
- YouTube share intent capture for saving a single video into the daily log.
- Video memory tags and notes for saved/shared videos.
- Daily and weekly review surfaces that prioritize recall-worthy videos.
- Harness documents, quality gates, CI workflow, PR template, and fixture-based regression tests.

## User-visible Changes To Review

- A user can import Takeout watch-history data and see daily/weekly records.
- A user can save a YouTube video through the Android share flow.
- A user can see the `Share` -> `More` -> `YouTube Daily Mind Map` chooser guidance in the import/settings screen.
- A user can tag a saved video as `remember`, `review`, or `saved`.
- A user can write a short video memory note.
- Daily review shows marked videos in `Today saved videos`.
- Weekly report shows marked videos in `This week saved videos`.
- Timeline and report cards show compact memory notes when present.

## Privacy And Policy Review

- Raw Takeout archives must stay local by default.
- Watch-history records, video titles, URLs, notes, OAuth tokens, Drive tokens, and Drive file names must not be logged.
- Google Drive access should remain user-selected file access, not broad Drive search.
- The app must not claim viewing duration unless the source data provides real duration.
- The app must keep a deletion path for imported records and saved personal notes.
- Any future AI summary must be opt-in, minimal-field, cache-aware, and deletable.

## Verification Checklist

- [ ] `npm run verify`
- [ ] `npx cap sync android`, if Android assets, Capacitor config, or native bridge behavior changed
- [ ] `android/gradlew assembleDebug`, if Android release or native code changed
- [ ] `android/gradlew assembleRelease`, before sharing an APK or Play Store candidate
- [ ] Release APK logcat smoke confirms native import debug logs are silent when the app is not debuggable
- [ ] Real Android device smoke test, if native import, share intent, loading UI, or APK packaging changed
- [x] Takeout ZIP import smoke test with a normal archive through Android Drive picker
- [x] Large Takeout structure smoke test with a 1GB+ archive or the closest available archive
- [x] YouTube share intent smoke test from the YouTube app
- [ ] Local deletion/clear-data flow smoke test

## Android Smoke Test Result - 2026-06-02

Device: Samsung SM-F966N foldable device, debug APK from the current working tree.

- [x] Next production build completed before Android sync.
- [x] Capacitor Android sync completed.
- [x] Android debug APK build completed.
- [x] APK installed on the real device.
- [x] App data was cleared before smoke testing.
- [x] App launch and home dashboard rendered.
- [x] Timeline screen rendered with grouped viewing records.
- [x] Weekly report screen rendered with recent-seven-day viewing records.
- [x] Takeout import/settings screen rendered.
- [x] Android file picker opened Google Drive at the Takeout location.
- [x] Non-private normal Takeout fixture ZIP with `watch-history.json` was generated, structure-scanned, and pushed to device Downloads; local structure scan found 1 watch-history candidate and no path traversal suspects.
- [x] Direct Drive upload UI opened for the normal fixture from both `file://` and MediaStore `content://` URIs, but those direct-upload attempts did not appear in Drive picker search or My Drive listing.
- [x] Google Drive app's own `New` -> `Upload` flow found the local fixture in Downloads and completed `1 upload`.
- [x] Android Drive picker search found the uploaded `takeout-codex-normal-20260602.zip` fixture as a user-selectable ZIP.
- [x] Android Drive normal fixture import completed on the real device; the app reported a JSON import summary with 3 added records, 0 duplicates, and 3 saved records, then showed the completion overlay.
- [x] Earlier user-provided small Drive ZIP selection did not dump watch-history contents and reported no candidate when only `Takeout/archive_browser.html` was present.
- [x] Reinstalled the current debug APK and selected the visible user-provided 56.83 kB Drive ZIP from the Drive Takeout location without dumping watch-history contents.
- [x] Native Drive import rejected that ZIP within about 1 second because the archive did not contain YouTube watch-history data; log review was limited to plugin status/error lines and file names.
- [ ] The native rejection did not surface as a visible UI error; after about 72 seconds the screen still showed `시청 기록 파일을 찾았습니다. 기록을 읽는 중입니다.` and saved records stayed at 0.
- [x] Android Drive duplicate re-import smoke selected the same uploaded normal fixture again; the app reported a JSON import summary with 0 added records, 3 duplicates, and 3 saved records, then showed the completion overlay.
- [x] Added a native Drive import progress watchdog in the web layer, but the latest smoke did not confirm that every native reject/stalled state reaches a user-visible error.
- [x] Added a JS native error propagation fix so listener cleanup cannot block rejected Drive imports, and native rejection updates the visible status message plus the error box.
- [x] The native reject/error propagation fix was synced into Android and rebuilt as a debug APK.
- [x] The rebuilt native reject/error propagation fix was reinstalled and re-smoke-tested on the real device.
- [x] Follow-up smoke reinstalled the rebuilt debug APK and selected the same visible 56.83 kB Drive ZIP without dumping watch-history contents.
- [x] The rebuilt APK surfaced the native rejection as a visible UI error within about 5 seconds, while saved records stayed at 0.
- [x] User-provided 1.62 GiB Takeout ZIP was structure-scanned without reading entry contents; scan read 75.43 KiB, took 3 ms, used about 616 KiB RSS delta, found 43 total entries and 30 file entries.
- [x] The 1.62 GiB structure smoke found 1 localized Korean HTML watch-history candidate, 0 path traversal suspects, and 0 oversized entries; the candidate was about 3.77 MiB compressed and 47.91 MiB uncompressed.
- [x] Google Drive app search for `takeout-20260527T093305Z-3-001` returned no matching selectable Drive file.
- [ ] Android full import from the 1.62 GiB real ZIP was not executed because the file is only local/Desktop in this smoke run, and raw Takeout upload to Drive was not performed without a separate user-facing consent flow.
- [ ] Large-import loading UI was not executed with the 1.62 GiB real ZIP because it was not available as a user-selected Drive file.
- [x] Quoted direct ADB `ACTION_SEND` smoke saved a YouTube-like `youtu.be` payload into today's records and opened the memory prompt.
- [x] Manual share from the installed YouTube app saved `Me at the zoo` into today's records and opened the memory prompt.
- [x] Import/settings screen explains the YouTube `Share` -> `More` -> app selection path for first-time users.
- [ ] YouTube chooser UX still requires `Share` -> `More` -> app selection on this device; review whether app naming/icon/priority is discoverable enough before public release.
- [x] Local deletion/clear-data flow smoke passed after seeding one shared test record; confirm dialog cleared saved records and returned to sample data.
- [x] Foldable settings screen received extra safe-area bottom spacing so the delete action has more room above the bottom nav.
- [x] Rechecked foldable settings screen after reinstall; delete action bounds `[110,1577][969,1656]`, bottom nav bounds `[0,2241][1080,2520]`.

## Android Release Privacy Smoke Result - 2026-06-03

Device: Samsung SM-F966N foldable device, release APK signed locally for smoke with the Android debug keystore.

- [x] `app-release-unsigned.apk` was zipaligned, signed for smoke, and verified with APK Signature Scheme v2/v3.
- [x] Signed release APK installed over the debug build with `adb install -r`.
- [x] `dumpsys package` showed `flags=[ HAS_CODE ALLOW_CLEAR_USER_DATA ALLOW_BACKUP ]` and `pkgFlags=[ HAS_CODE ALLOW_CLEAR_USER_DATA ALLOW_BACKUP ]`, with no `DEBUGGABLE` flag.
- [x] Non-private `takeout-codex-release-smoke.zip` fixture was generated and pushed to device Downloads.
- [x] Android DocumentsUI selected the local release fixture and a previously used normal fixture; `adb logcat -d -s NativeDriveFile` produced no output after each attempt.
- [x] Earlier release smoke did not show an import completion, duplicate summary, or native rejection UI after local fixture attempts, so a refreshed release smoke was required.
- [x] Earlier Drive-hosted small ZIP reject/completion visibility was not conclusively reproduced, so the refreshed release smoke used a known Drive fixture.
- [x] Latest web bundle was synced into Android with `npx cap sync android`, then `android/gradlew assembleRelease` completed.
- [x] The refreshed release APK was zipaligned, signed locally for smoke, verified with APK Signature Scheme v2/v3, and installed on the real device.
- [x] The refreshed release APK still showed no `DEBUGGABLE` flag in `dumpsys package`.
- [x] Android DocumentsUI opened directly to Drive > My Drive > Takeout and showed the known 56.83 kB Drive ZIP plus the 1.78 GB user Takeout ZIP.
- [x] Selecting the known 56.83 kB Drive ZIP in the refreshed release APK surfaced the last Drive import outcome card after the picker returned.
- [x] The visible outcome card and error box showed `Takeout ZIP 안에서 YouTube 시청 기록을 찾지 못했습니다. Takeout에서 YouTube 및 YouTube Music의 기록을 포함했는지 확인해주세요.`
- [x] `adb logcat -d -s NativeDriveFile` produced no output during the refreshed release known-Drive-fixture rejection smoke.
- [x] Release valid-archive completion and duplicate-summary visibility were re-smoked after the refreshed release APK install using the Drive-hosted `takeout-codex-normal-20260602.zip` fixture.
- [x] The release valid-fixture selection returned to the app, showed the completion overlay, and reported `Takeout ZIP · JSON: 새 기록 0개 추가 · 중복 3개 건너뜀 · 저장된 기록 40103개 · Takeout/YouTube and YouTube Music/history/watch-history.json` because the fixture records already existed in local storage.
- [x] Re-selecting the same Drive-hosted valid fixture also returned to the app, showed the completion overlay, and preserved the duplicate summary.
- [x] `adb logcat -d -s NativeDriveFile` produced no output during the release valid-fixture completion and duplicate re-import smoke.
- [x] Release YouTube share intent smoke opened the installed YouTube app to the public `Me at the zoo` video, tapped YouTube's `공유` button, swiped the YouTube share target row, tapped `더보기`, and selected `YouTube Daily Mind Map` from the Android resolver.
- [x] The release app saved that shared video into today's records and showed `공유한 영상을 오늘의 기록에 저장했습니다. 저장된 기록 1개`.
- [x] The release app rendered `오늘 1개`, `03:27 · 기타 Me at the zoo 채널 없음`, the `기억할 영상` prompt, and the `메모 저장` action after the share returned.
- [x] `adb logcat -d -s NativeShareIntent NativeShareIntentPlugin ShareIntent` produced no output during the release YouTube share smoke.

## Current Remaining Risks

- Drive file selection may behave differently across Android vendors and file providers; direct `file://` and MediaStore `content://` upload attempts did not produce a selectable Drive file, while the Google Drive app's own upload flow did.
- Android Drive invalid-ZIP/native rejection handling passed real-device smoke with the 56.83 kB Drive ZIP, and normal completion passed with a small synthetic watch-history fixture.
- Android Drive duplicate re-import passed with the small synthetic watch-history fixture, but large real duplicate archives still need performance/storage verification.
- The 1.62 GiB real Takeout structure scan now finds a localized Korean watch-history candidate, but Android full Drive copy/parsing remains unverified because that real ZIP was not selectable in Drive.
- Release APK native import logcat silence, known invalid Drive ZIP rejection visibility, and small valid-archive completion/duplicate-summary visibility passed with the refreshed locally signed release smoke; large real duplicate archives still need performance/storage verification.
- Release APK YouTube share intent behavior passed real-device smoke on the Samsung SM-F966N, but broader Android/vendor chooser discoverability still needs review before public release.
- Storage fields for video memory are currently lightweight `WatchItem` fields, not a versioned migration.
- UI copy and layout still need real phone and foldable-device review before public sharing.
- The working tree may include multiple feature groups; release notes should separate them before commit or deploy.

## Go / No-go Notes

- Go only if release-level verification passes and any Android/native changes have an Android smoke test result.
- No-go if import, share save, deletion, or daily/weekly review surfaces regress.
- No-go if the release introduces broader data access, automatic AI calls, or server upload of personal records without ADR and consent flow.
