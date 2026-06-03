# ADR 0007: Native Share Receiver Storage Bridge

## Status

Accepted

## Context

ADR 0006 allows an optional quick share save mode so a user can share a YouTube video, save it quickly, receive a lightweight confirmation, and return to YouTube when Android permits it.

The current Android share path routes `ACTION_SEND` through `MainActivity`. That keeps implementation simple because the WebView application can consume the pending share and save it through the existing shared-video flow. The tradeoff is that Android may briefly show the app/WebView transition, including a white surface, before the quick-save completion moves the task back.

A dedicated `ShareReceiverActivity` reduces that visible interruption by handling the incoming share natively before the main WebView is launched. That improvement creates a storage boundary question: native Android code receives a potentially personal YouTube URL, while the durable user records currently live behind the web application and its local storage/repository flow.

## Decision

Introduce a native pending-share queue as the storage bridge for the dedicated `ShareReceiverActivity`.

The dedicated receiver may parse only enough of the incoming Android share intent to validate that it is a supported YouTube share candidate, write a minimal pending-share payload into app-private native storage, show a short Android-native confirmation when quick share save is enabled, and finish the receiver flow.

The native pending-share payload is limited to:

- Shared text or URL candidate.
- Optional Android share subject.
- Received timestamp.
- Source marker such as `android-share`.
- A generated pending-share id for drain and acknowledgement.

The receiver must not write directly to WebView `IndexedDB` or browser local storage. WebView storage is owned by the web application layer and may change with schema migrations. Instead, the typed native bridge drains pending shares into the application layer, where the existing shared-video save use case normalizes the payload, deduplicates same-day shares, persists the final `VideoMemory` or equivalent record, and acknowledges the native queue item after successful handling.

The bridge flow is:

1. `ShareReceiverActivity` receives a YouTube share intent.
2. The receiver stores a minimal pending-share item in app-private native storage.
3. The receiver returns control quickly when quick share save is enabled, or falls back to launching the main app when a prompt is required.
4. The typed native bridge exposes a drain API such as `drainPendingShares`.
5. The web application calls the shared-video save use case for each drained item.
6. The web application acknowledges handled item ids through the typed native bridge.
7. A deletion/reset flow clears the native pending-share queue together with local personal data deletion.

The queue must be local-only. It must not upload shared URLs, titles, notes, or pending-share payloads to a server. It must not trigger remote AI, payments, broad Drive access, overlay permissions, or cross-device sync.

Queue implementation must include a small size cap, an age or retry cap, and an explicit clear path so personal URLs are not retained indefinitely if the WebView application never drains them.

## Alternatives Considered

- Continue using only `MainActivity` and an in-memory pending share: simple and already working, but it can keep the brief WebView transition and can lose a share if process state is recreated before the app consumes it.
- Write directly from native Android code into WebView `IndexedDB`: rejected because it couples native code to browser storage internals, bypasses TypeScript domain validation, risks schema drift, and makes storage migration harder.
- Store complete video records natively and synchronize later: rejected for the MVP because it duplicates persistence rules and deduplication logic across Android and web layers.
- Use an Android overlay or draw inside YouTube: rejected by ADR 0006 because it creates trust, permission, and Play Store policy risk.
- Automatically summarize the shared video from the native receiver: rejected by ADR 0005 because AI insight must remain explicit, quota-safe, and privacy-aware.

## Consequences

This decision gives the future native receiver a narrow, durable handoff point without letting Android code own the final user record schema. It reduces the risk of the white app-transition flash while preserving local-first processing and the existing web/domain save path.

The tradeoff is additional native bridge complexity. The implementation will need native storage code, bridge methods for drain and acknowledgement, queue cleanup rules, and Android real-device smoke. It also needs tests proving that duplicate shares still flow through the same domain deduplication path and that native queue entries do not bypass deletion.

If the receiver cannot safely persist or drain the pending item, the fallback is to route the share through the existing `MainActivity` flow with a clear saved or error state.

## Verification

- Tests must keep this ADR aligned with the architecture document and risk register.
- Native tests must prove the receiver stores only minimal pending-share payloads in app-private storage.
- Bridge tests must prove pending shares are drained and acknowledged through a typed native bridge.
- Web tests must prove drained shares are saved through the existing shared-video save use case and same-day duplicates are skipped.
- Privacy tests must prove shared URLs, notes, titles, pending-share payloads, OAuth tokens, and Drive tokens are not logged.
- Deletion tests must prove local personal-data deletion clears the native pending-share queue.
- Future Android smoke must cover cold-start share, warm-app share, quick-share return behavior, fallback prompt behavior, and non-YouTube share rejection.
- UI and report copy must continue to avoid watch-duration claims unless true duration data exists.
