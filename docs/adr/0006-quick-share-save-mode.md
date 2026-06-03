# ADR 0006: Quick Share Save Mode

## Status

Proposed

## Context

The normal YouTube share flow opens the app and shows the shared-memory prompt so the user can tag or note the video immediately. This is useful for intentional memory capture, but it interrupts the user while they are still inside YouTube.

The product needs a lower-friction daily loop: a user should be able to share a video, save it, receive a lightweight confirmation, and return to YouTube without being forced through a full in-app prompt every time.

Android does not allow this app to render an arbitrary custom bottom sheet inside the YouTube app. Overlay-style UI over another app would create trust, permission, and Play Store policy risk. The safe path is to handle the share in this app, keep the transition brief, and return control to the previous app when the user has opted into fast saving.

## Decision

Add an optional quick share save mode for Android YouTube shares.

When quick share save mode is enabled:

1. The Android share intent still routes through this app.
2. The app extracts the YouTube URL and video id.
3. The app saves the shared video immediately as a manual/shared memory record.
4. The app shows a short Android-native confirmation such as `오늘 기록에 저장했어요`.
5. The app finishes the share receiver flow and returns the user to the previous app when Android permits it.

The quick save flow must not:

- Render an overlay on top of YouTube.
- Request broad overlay permissions.
- Automatically call remote AI.
- Require the user to write a note before saving.
- Claim watch duration.

Users can later edit the saved video's tag or note from the Home, Timeline, or detail surface. The default share flow may continue to show the memory prompt until the user enables quick share save mode.

## Alternatives Considered

- Show a custom bottom sheet inside YouTube: rejected because this app cannot safely render inside another app's UI without risky overlay behavior.
- Always quick-save and return: rejected because some users want the immediate memory prompt and tag/note capture.
- Always open the full app prompt: current behavior, but it adds friction to the daily share loop.
- Automatically summarize on share: rejected because ADR 0005 keeps AI insight optional due to cost, quota, and privacy constraints.

## Consequences

Quick save mode makes daily saving feel closer to staying in YouTube while preserving local-first processing and Android app boundaries.

The tradeoff is that the saved video may lack a tag or note at first. The Home and Timeline surfaces must make later editing discoverable, especially for directly saved/shared videos.

Native implementation will need Android real-device smoke because the behavior depends on Android task stack and share receiver behavior. If Android cannot reliably return to the previous app on a device, the fallback is to keep the app open with a clear saved confirmation.

## Verification

- Tests must keep this ADR aligned with UC-02 and the risk register.
- Future implementation tests must prove quick share save persists the shared video without calling remote AI.
- Future implementation tests must prove duplicate same-day shares do not create duplicate records.
- Future Android smoke must confirm the app shows a lightweight confirmation and either returns to the previous app or shows a clear fallback saved state.
- Future UI copy must say "record count" or "saved record", not watch time or usage time.
