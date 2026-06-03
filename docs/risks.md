# Risk Register

## Product Risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Takeout import is too slow for daily use. | High | Treat Takeout as weekly/monthly reconciliation. Build daily loop around YouTube share save. |
| Share save flow interrupts YouTube viewing. | Medium | Offer an optional quick share save mode that saves locally, shows a lightweight confirmation, and returns to the previous app when Android permits it. |
| Mind map UI is unfamiliar on mobile. | Medium | Make timeline and report the primary surfaces. Keep mind map as a supporting view. |
| Users do not pay for visualization alone. | High | Paid value should come from weekly/monthly reports, AI insights, export, search, and memory retention. |
| YouTube Recap competes with the core novelty. | Medium | Differentiate with daily/weekly persistence, notes, search, and local archive. |

## Privacy And Policy Risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Users fear watch-history leakage. | High | Local-first processing, prominent privacy copy, deletion controls, no raw upload by default, debug-only anonymized native import logs, persistent visible import outcome cards, release APK logcat smoke before APK sharing, and repeat release import result smoke when file selection returns without a visible completion or rejection state. |
| Broad Google Drive permissions trigger verification burden. | High | Prefer Android file picker or `drive.file` with user-selected files. |
| YouTube API storage policies create compliance burden. | Medium | Minimize API usage. Prefer user-provided Takeout and user-shared URLs. |
| AI prompts leak sensitive records. | High | Require explicit opt-in, send minimal fields, cache results, provide deletion. |
| Native share receiver queue retains personal URLs longer than intended. | Medium | Keep only a minimal app-private pending-share queue, add size and age caps, drain through the typed native bridge, acknowledge handled items, clear the queue on local personal-data deletion, and never log pending-share payloads. |

## Technical Risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Large ZIP import freezes UI or crashes Android. | High | Native selective ZIP scanning, progress events, cancellation, size guards. |
| Duplicate records corrupt daily reports. | High | Stable event identity using video id/url plus watchedAt. Test repeated imports. |
| Date grouping creates user confusion. | Medium | Use simple calendar-day default and label date ranges clearly. |
| Storage schema changes break existing users. | Medium | Add versioned migration tests before release. |
| Dedicated native share receiver bypasses web/domain save rules. | Medium | Use a native pending-share queue only as a handoff layer; drain through the typed native bridge and persist via the existing shared-video save use case, not direct WebView `IndexedDB` writes. |
