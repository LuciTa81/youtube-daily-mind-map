# ADR 0008: Play Store Upload Signing

## Status

Accepted

## Context

The app is moving from debug and smoke-signed APK testing toward Play Store distribution. Existing smoke signing exists only to make local and CI debug artifacts testable on real devices without destroying local records. That certificate must not be reused for production distribution.

Play Store candidates need a distinct signing lane. Google Play commonly uses Play App Signing: developers sign an Android App Bundle with an upload key, and Google signs the APKs delivered to users with the app signing key. This means a locally upload-key-signed artifact is not the same as the final Play-delivered APK.

If the signing lane is ambiguous, the team could accidentally share an unsigned APK, a debug-signed APK, or a smoke-signed release APK as if it were a Play candidate. That would make update-install, privacy smoke, and user data preservation claims unreliable.

## Decision

Use separate signing lanes for Play Store candidates:

- Play Store candidates must use a Play upload signing key or the Play release signing path, never the smoke debug signing certificate or Android debug keystore.
- The preferred Play artifact is an Android App Bundle built for `bundleRelease` and signed with the Play upload key once release signing configuration exists.
- Upload signing material must stay outside the repository. If automated later, it must live in CI secrets and be restored only for the signing step.
- Suggested future environment names are `PLAY_UPLOAD_KEYSTORE_FILE`, `PLAY_UPLOAD_KEYSTORE_PASSWORD`, `PLAY_UPLOAD_KEY_ALIAS`, and `PLAY_UPLOAD_KEY_PASSWORD`.
- Partial Play signing configuration must fail the build rather than silently producing an unsigned or ambiguously signed candidate.
- Until a Play upload/release signing lane exists, `app-release-unsigned.apk` and locally smoke-signed release APKs are release-variant smoke artifacts only. They must not be described as Play Store candidates.
- A local upload-key-signed APK must not be used to claim update compatibility with a Play-installed app when Play App Signing is enabled. Play update behavior should be validated through an internal testing track or another artifact signed with the same final app signing certificate.
- Record the artifact type, signing certificate fingerprint, version code, version name, device, and verification path before external testing.

## Alternatives Considered

- Reuse the smoke debug signing certificate for Play candidates: rejected because smoke signing is only a test lane and would blur production signing boundaries.
- Share locally smoke-signed release APKs as public release candidates: rejected because they are useful for native privacy smoke but not equivalent to Play delivery.
- Commit an upload keystore to the repository: rejected because signing material must not live in source control.
- Configure release signing immediately in Gradle: deferred because the signing key and distribution owner decisions should be made deliberately before storing CI secrets or local environment values.

## Consequences

- Release-variant smoke can continue without pretending to be Play distribution.
- Play Store preparation has a clear path that does not endanger smoke signing or local records.
- Future automation has named environment variables and a failure policy to implement.
- Before public release, the team still needs to create or register the Play upload key, configure signing outside the repository, and repeat release privacy smoke on the intended distribution path.

## Verification

Before calling an artifact a Play Store candidate:

- Confirm `bundleRelease` or the intended Play release task passed with the Play upload/release signing lane.
- Confirm the artifact is not unsigned, debug-signed, smoke-debug-signed, or locally smoke-signed with the Android debug keystore.
- Verify the signing certificate fingerprint and record it in the release notes or pre-release summary.
- Confirm no `.jks`, `.keystore`, `.apk`, `.aab`, passwords, signing output, or restored CI keystore files are committed.
- Confirm release APK or internal testing logcat privacy smoke shows no watched titles, URLs, Drive file names, tokens, local paths, or user notes.
- If update behavior matters for Play-installed users, validate through Play internal testing or an artifact signed with the same final app signing certificate. Do not treat a local upload-key APK install as proof of Play update compatibility.
