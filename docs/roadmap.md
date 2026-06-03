# Product Roadmap

This roadmap keeps the next work focused while the product is still YouTube-first and Android-primary.

## Current Position

The app is past the first prototype stage. Core Takeout parsing, Drive-assisted import handling, large-import progress, YouTube share capture, local storage, daily review, weekly report, timeline, and supporting mind-map views have working implementation and regression coverage.

The next goal is not to expand the data sources. The next goal is to make the YouTube memory loop feel useful without requiring new permissions, remote AI, payments, or phone-only smoke on every small change.

## Done Enough For Now

- YouTube-first product boundary and Android-primary architecture.
- Local-first Takeout parsing and record deduplication.
- Drive/file-picker import path with invalid ZIP, valid fixture, duplicate import, large archive, and cancellation coverage.
- YouTube share intent capture and optional quick-share save mode.
- Daily and weekly review surfaces that separate directly saved memories from passive Takeout records.
- Watch-history storage schema version and legacy-record migration guard.
- Design, Android smoke, release, and privacy checklists.
- CI quality gates, Android APK build, Vercel deployment, and PWA static assets.

## Phone-less Priority Queue

These tasks can continue without a physical phone.

1. Review Home, Timeline, Import, and Weekly Report as product surfaces using browser screenshots or DOM evidence before visual CSS changes.
2. Improve daily and weekly memory value without AI: clearer saved-memory cards, recall prompts, empty states, and local search/filter behavior.
3. Strengthen storage and report tests around saved memories, review notes, date ranges, and duplicate imports.
4. Prepare manual smoke scripts or checklists for legacy IndexedDB migration and large-import edge cases.
5. Keep copy honest: use viewing record counts, not watch time, unless duration data exists.

## Phone-required Release Queue

These tasks should wait for a real device or final release pass.

1. Standard non-foldable Android phone smoke.
2. Real YouTube app share chooser and quick-save transition smoke.
3. Real Drive large Takeout import, cancellation, and post-import usability smoke.
4. APK update-install with seeded local data to confirm record preservation.
5. Play Store or final signed release candidate privacy/logcat smoke.

## Future Product Bets

These require ADR or explicit approval before implementation.

- Optional AI video insight with quota, cache, consent, and deletion.
- Premium or payment behavior.
- Cross-device sync or server storage.
- Broad Google Drive search or broader OAuth scopes.
- Expansion beyond YouTube into KakaoTalk, Naver, photos, health, or a general life archive.

## Decision Rule

When choosing the next task, prefer the highest item that does not require a phone unless the change touches Android native behavior, Drive provider behavior, APK signing, or YouTube share UX. If a task changes UI layout or visual styling, follow `docs/checklists/design-qa.md` and require screen evidence before visual-only edits.
