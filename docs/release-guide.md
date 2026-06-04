# Release Guide

This guide keeps Android release preparation separate from debug and smoke testing. It is not a place for signing secrets.

## Artifact Types

- Debug APK: built for local development and clean-install smoke.
- Smoke debug APK: debug APK signed with the dedicated smoke debug certificate from ADR 0004.
- Locally smoke-signed release APK: release variant used for privacy and native behavior smoke only.
- Play Store candidate: Android App Bundle or Play-generated internal testing artifact that follows ADR 0008.

Do not describe `app-release-unsigned.apk`, an Android-debug-key-signed APK, or a locally smoke-signed release APK as a Play Store candidate.

## Play Upload Signing Setup

The preferred Play artifact is an Android App Bundle:

```powershell
$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME='C:\Users\IML4\AppData\Local\Android\Sdk'
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
$env:Path="$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
.\android\gradlew.bat -p android bundleRelease
```

Future Gradle release signing should use a Play upload key that is stored outside the repository. Suggested local environment names:

```text
PLAY_UPLOAD_KEYSTORE_FILE=
PLAY_UPLOAD_KEYSTORE_PASSWORD=
PLAY_UPLOAD_KEY_ALIAS=
PLAY_UPLOAD_KEY_PASSWORD=
```

If CI signing is automated later, store those values in CI secrets and restore the keystore only during the signing step. Remove any restored keystore before uploading artifacts.

## Safety Rules

- Never commit `.jks`, `.keystore`, `.apk`, `.aab`, signing reports, or passwords.
- Never reuse the smoke debug signing certificate for Play upload signing.
- Fail the build if only part of the Play signing configuration is present.
- Record artifact type, version code, version name, signing certificate fingerprint, device, and verification path before external testing.
- If Play App Signing is enabled, do not treat a locally upload-key-signed APK install as proof that Play-delivered updates work. Use Play internal testing or an artifact signed with the same final app signing certificate.

## Verification Before External Testing

Run these gates before sharing a Play candidate:

```bash
npm run verify
npx cap sync android
android/gradlew assembleRelease
android/gradlew bundleRelease
```

Then confirm:

- The Play artifact is signed by the Play upload/release signing lane.
- The artifact is not unsigned, debug-signed, smoke-debug-signed, or locally smoke-signed with the Android debug keystore.
- Release logcat privacy smoke shows no watched titles, URLs, Drive file names, tokens, local paths, or user notes.
- YouTube share, Takeout import, duplicate import, deletion, and layout smoke pass on the intended release path.
