# ADR 0004: CI Debug APK Smoke Signing

## Status

Accepted

## Context

Android update installs require the existing installed package and the new APK to be signed by the same certificate. The GitHub Actions debug APK currently builds successfully and can be verified as an artifact, but a real-device `adb install -r` over a locally installed app can fail with `INSTALL_FAILED_UPDATE_INCOMPATIBLE` when the local build and CI build use different debug signing keys.

This matters because update-install smoke is different from clean-install smoke. A clean install proves that the artifact can be installed from scratch. An update install proves that testers can install a newer artifact over an existing app without uninstalling and losing local records. The app is local-first, so accidental uninstall or clear-data flows can destroy user-owned viewing records and notes.

## Decision

Use separate signing lanes:

- CI debug APK artifacts may continue to be produced for clean-install emulator smoke.
- CI debug APK artifacts may be used for real-device update-install smoke only after CI and local smoke builds share the same dedicated smoke debug signing certificate.
- The repository supports an optional smoke debug signing lane through `SMOKE_DEBUG_KEYSTORE_FILE`, `SMOKE_DEBUG_KEYSTORE_PASSWORD`, `SMOKE_DEBUG_KEY_ALIAS`, and `SMOKE_DEBUG_KEY_PASSWORD`.
- GitHub Actions restores `SMOKE_DEBUG_KEYSTORE_BASE64` to `android/app/smoke-debug.keystore` when the secret is configured, then removes that file after the workflow.
- If smoke signing secrets are absent, GitHub Actions continues producing clean-install debug artifacts with the runner debug signing key.
- Partial smoke signing configuration fails the Gradle build instead of silently producing an ambiguous artifact.
- The smoke debug signing certificate must not be committed to the repository. It should live in GitHub Actions secrets for CI and outside the repository for local smoke builds.
- The smoke debug signing certificate is only for debug or smoke artifacts. It must not be used for Play Store release, Play upload signing, or production distribution.
- Play Store candidates must use the Play release or upload signing path, separate from smoke debug signing.
- Until the smoke debug signing secrets and local smoke environment are configured, CI debug artifacts must be treated as clean-install artifacts. They must not be claimed to validate `adb install -r` over an existing local install.
- If `INSTALL_FAILED_UPDATE_INCOMPATIBLE` occurs during smoke, record it as a signing mismatch. Do not uninstall the existing app or clear local data unless the user explicitly approves that destructive test step.

## Alternatives Considered

- Keep using the default runner-generated debug keystore: simplest for CI, but it cannot prove update-install compatibility with locally installed builds.
- Commit a reusable debug keystore to the repository: convenient, but it trains the repo to store signing material and blurs the line between smoke signing and release signing.
- Always uninstall before installing CI artifacts: useful for clean-install smoke, but it does not test update behavior and can destroy local-first user data.
- Use the Play Store release key for all artifacts: not appropriate for debug artifacts and would mix release signing with local smoke workflows.

## Consequences

- Update-install smoke becomes a deliberate release gate instead of an accidental property of whichever machine built the APK.
- CI artifacts remain useful for clean-install smoke immediately.
- Local records are protected because signing mismatch does not automatically lead to uninstall or clear-data.
- A future setup step still needs creating the smoke debug key and adding GitHub Actions secrets and local environment values.
- Release and Play Store signing stay separate from debug smoke signing.

## Verification

Before claiming update-install compatibility for a CI debug APK:

- Confirm `SMOKE_DEBUG_KEYSTORE_BASE64`, `SMOKE_DEBUG_KEYSTORE_PASSWORD`, `SMOKE_DEBUG_KEY_ALIAS`, and `SMOKE_DEBUG_KEY_PASSWORD` are configured in GitHub Actions secrets.
- Confirm local smoke builds use the same keystore via `SMOKE_DEBUG_KEYSTORE_FILE`, `SMOKE_DEBUG_KEYSTORE_PASSWORD`, `SMOKE_DEBUG_KEY_ALIAS`, and `SMOKE_DEBUG_KEY_PASSWORD`.
- Compare the local smoke APK and CI debug APK signing certificate fingerprints with `apksigner verify --print-certs`.
- Confirm the CI artifact installs over an existing app with `adb install -r` without uninstalling or clearing data.
- Confirm the app launches after the update install.
- Confirm local saved records remain present after the update install.
- Keep the Play Store release signing path separate and repeat release privacy smoke for release candidates.
