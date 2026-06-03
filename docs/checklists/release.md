# Release Checklist

Use this before sharing an APK, publishing a Play Store build, or pushing production web changes.

## Product

- [ ] The release has a clear user-facing purpose.
- [ ] The release does not expand beyond YouTube-first scope without an ADR.
- [ ] Empty, error, loading, and success states were checked.
- [ ] Korean copy avoids claiming watch duration unless duration exists.

## Privacy

- [ ] Raw Takeout files are not uploaded by default.
- [ ] Watch-history records, notes, tokens, and Drive file names are not logged.
- [ ] Release APK logcat smoke confirms native import debug logs are silent when the app is not debuggable.
- [ ] Data deletion flows still work.
- [ ] Privacy copy matches actual behavior.
- [ ] Any Drive, AI, analytics, payment, or sync behavior is documented.

## Quality Gates

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] GitHub Actions `Quality Gates` passed and the `import-surface-smoke` artifact contains the 390px Import surface screenshot and JSON evidence.
- [ ] `npx cap sync android`, if Android assets changed
- [ ] `android/gradlew assembleDebug`, if Android release or native code changed
- [ ] `android/gradlew assembleRelease`, before sharing an APK or Play Store candidate

## Android Signing And Update Install

- [ ] The APK signing lane is known: CI debug artifact, local smoke debug artifact, locally smoke-signed release APK, or Play Store candidate.
- [ ] CI debug artifacts are treated as clean-install artifacts unless they are signed with the same dedicated smoke debug certificate as the local smoke build.
- [ ] Smoke debug signing material is stored outside the repository and, for CI, in GitHub Actions secrets. Do not commit keystores, passwords, signing output, APKs, or `.jks`/`.keystore` files.
- [ ] When using the smoke debug signing lane locally, `SMOKE_DEBUG_KEYSTORE_FILE`, `SMOKE_DEBUG_KEYSTORE_PASSWORD`, `SMOKE_DEBUG_KEY_ALIAS`, and `SMOKE_DEBUG_KEY_PASSWORD` are set.
- [ ] When using the smoke debug signing lane in CI, GitHub Actions secrets include `SMOKE_DEBUG_KEYSTORE_BASE64`, `SMOKE_DEBUG_KEYSTORE_PASSWORD`, `SMOKE_DEBUG_KEY_ALIAS`, and `SMOKE_DEBUG_KEY_PASSWORD`; the workflow removes `android/app/smoke-debug.keystore` after the build.
- [ ] If the smoke debug signing secrets are not configured, GitHub Actions debug artifacts are clean-install only.
- [ ] Play Store candidates use the release or upload signing path, not the smoke debug signing certificate.
- [ ] If update behavior matters, `adb install -r` succeeds over an existing install signed by the same smoke or release certificate.
- [ ] If `INSTALL_FAILED_UPDATE_INCOMPATIBLE` occurs, record it as a signing mismatch and do not uninstall or clear local data without explicit user approval.

## Manual Smoke

- [ ] App launches on a real Android device.
- [ ] Takeout import flow opens.
- [ ] Large-file import progress screen is readable.
- [ ] Android real-device smoke follows `docs/checklists/android-smoke-test.md` for import, share intent, deletion, layout, and release logcat privacy checks.
- [ ] Release APK native import logcat output does not include Drive file names, local cache paths, watched titles, URLs, or native import timing messages.
- [ ] Timeline and report screens render.
- [ ] User can clear or replace imported data.
