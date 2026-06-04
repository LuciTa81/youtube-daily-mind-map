# Android Share Intent Routing Audit

Use this note when changing Android share behavior or interpreting real-device smoke results. It keeps the public Android share entry point separate from the web/domain save path.

## Current Routing

As of 2026-06-04, the intended routing is:

1. Android resolver receives a `text/plain` `ACTION_SEND` share.
2. The installed package resolves that share to `com.lucita81.youtubedailymindmap/.ShareReceiverActivity`.
3. `ShareReceiverActivity` stores only a minimal pending-share payload through `NativeShareIntentQueue`.
4. If quick share save is enabled, the receiver shows a short native confirmation and finishes.
5. If the full prompt is needed, the receiver launches `MainActivity`.
6. The React/WebView app drains pending shares through the typed `NativeShareIntent` bridge.
7. The existing shared-video save use case normalizes, deduplicates, persists, and acknowledges the pending item.

`MainActivity` remains the launcher and WebView host. It is not the public `ACTION_SEND` target in the source manifest. It still registers `NativeShareIntentPlugin` and handles intents as a fallback path so older installs, warm intents, or explicit tests do not strand a pending share.

## Evidence To Check

Source manifest expectation:

- `.MainActivity` has `android.intent.action.MAIN` and `android.intent.category.LAUNCHER`.
- `.MainActivity` does not have `android.intent.action.SEND`.
- `.ShareReceiverActivity` is exported, uses `@style/AppTheme.ShareReceiver`, is excluded from recents, has `noHistory`, and has the `text/plain` `ACTION_SEND` filter.

Installed-package expectation:

```powershell
adb shell dumpsys package com.lucita81.youtubedailymindmap |
  Select-String -Pattern "MainActivity|ShareReceiverActivity|android.intent.action.SEND|text/plain" -Context 3,5
```

Expected result:

- `Activity Resolver Table` maps `text/plain` and `android.intent.action.SEND` to `.ShareReceiverActivity`.
- `Non-Data Actions` maps `android.intent.action.MAIN` to `.MainActivity`.
- No full shared URL, video title, note, token, Drive file name, or watch-history content is recorded in the evidence.

2026-06-04 installed-package audit on the Samsung foldable showed this expected split: `ACTION_SEND`/`text/plain` resolved to `.ShareReceiverActivity`, while launcher `MAIN` resolved to `.MainActivity`.

## Interpreting Smoke Results

If a YouTube share appears to bring `MainActivity` to the foreground, that is not automatically a routing failure. In prompt mode, `ShareReceiverActivity` may enqueue the share and then launch `MainActivity` for the existing memory prompt. Confirm the public target with the installed-package resolver table before changing code.

Treat the routing as failed only if one of these is true:

- The source manifest exposes `ACTION_SEND` on `.MainActivity`.
- The installed package resolver maps `text/plain` `ACTION_SEND` to `.MainActivity`.
- A share is saved without flowing through the typed native bridge and existing shared-video save use case.
- The receiver writes directly to WebView `IndexedDB`, browser local storage, or any server.

## Future Native Fast-save Scope

Before trying to further reduce the brief white transition during sharing:

- Keep the public `ACTION_SEND` target on `ShareReceiverActivity`.
- Keep `ShareReceiverActivity` lightweight: validate, enqueue, optionally toast, optionally launch `MainActivity`, then finish.
- Keep durable records in the existing web/domain save path.
- Keep the pending-share queue local, capped, clearable, and privacy-safe.
- Do not add overlay permissions or draw inside the YouTube app.
- Do not trigger remote AI from the native receiver.
- Do not log raw shared text, URLs, titles, notes, or pending-share payloads.

Required verification for a routing change:

- `npm run build`
- `npx cap sync android`
- `android/gradlew assembleDebug`
- Source manifest test confirms `ACTION_SEND` is not on `MainActivity`.
- Installed-package `dumpsys package` confirms `ACTION_SEND`/`text/plain` resolves to `ShareReceiverActivity`.
- Direct component smoke with a non-private YouTube-like URL candidate.
- Official YouTube app smoke for a normal watch page, Shorts, and live-style share.
- Duplicate same-day share smoke.
- Non-YouTube `text/plain` share rejection smoke.
- Filtered logcat privacy smoke for `NativeShareIntent`, `NativeShareIntentPlugin`, and `ShareIntent`.
