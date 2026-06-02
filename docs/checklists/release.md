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
- [ ] `npx cap sync android`, if Android assets changed
- [ ] `android/gradlew assembleDebug`, if Android release or native code changed
- [ ] `android/gradlew assembleRelease`, before sharing an APK or Play Store candidate

## Manual Smoke

- [ ] App launches on a real Android device.
- [ ] Takeout import flow opens.
- [ ] Large-file import progress screen is readable.
- [ ] Release APK native import logcat output does not include Drive file names, local cache paths, watched titles, URLs, or native import timing messages.
- [ ] Timeline and report screens render.
- [ ] User can clear or replace imported data.
