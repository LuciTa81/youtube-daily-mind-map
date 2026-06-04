# Library Information Architecture

This document defines the saved-video library before adding new screens. It keeps the product YouTube-first, local-first, and focused on daily and weekly memory.

## Purpose

The Library is the place where the user intentionally saved YouTube videos live.

It is not a replacement for the Timeline:

- Library: videos the user saved, tagged, or annotated.
- Timeline: all viewing records available for a selected date or range, including Takeout-backed records.
- Home: today's memory summary and the fastest path back into recently saved items.
- Reports: weekly or monthly patterns and recall candidates.
- Settings: import, privacy, deletion, help, and app preferences.

## Navigation Model

The main app should use a small set of bottom-level destinations:

1. Home
2. Library
3. Timeline
4. Reports
5. Settings

Nested pages are allowed and expected. For example, tapping a saved-video card from Home or Library can open a Video Detail page even if that detail page is not a bottom tab.

Rules:

- Bottom tabs are for primary destinations only.
- Home cards may link into nested pages, but should not duplicate every bottom-tab action as large competing buttons.
- A saved-video card opens Video Detail.
- A report card opens Report Detail.
- Import and privacy controls live under Settings or an import entry point, not as a permanent bottom tab.

## Library Filters

The Library must support these saved-video filters:

| Filter key | Korean label | Meaning |
| --- | --- | --- |
| `all` | 전체 | Every saved video memory. |
| `remember` | 기억할 영상 | Videos the user marked as important to remember. |
| `review` (`review-later` product alias) | 나중에 복습 | Videos the user wants to revisit later. |
| `saved` | 그냥 저장 | Videos saved without stronger intent. |

Default ordering is newest saved first across all filters.

Reasons:

- It matches how users return to recently shared videos.
- It avoids making one tag feel more important than another.
- It keeps Home simple: the newest saved item can appear first, while filters handle intent-specific browsing.

Future priority sorting can be added later, but it must be an explicit sort mode rather than the default.

## Home Relationship

Home should show a compact memory preview, not the whole Library.

Home can include:

- The newest saved video memory.
- A short "recently saved" strip.
- A "View Library" entry point.
- A clear empty state that teaches YouTube share save.

Home should not include full Library filters if those filters make the first screen crowded. The filters belong in Library.

## Timeline Relationship

Timeline remains the best surface for "when did I see what?".

Rules:

- Timeline includes Takeout-backed viewing records.
- Saved videos are highlighted in Timeline when they match a record.
- A Takeout-only record can offer "save to Library" later, but it is not a Library item until the user intentionally saves or marks it.
- Timeline must show local clock time and viewing record count language, not duration claims.

## Video Detail Page

Video Detail is a nested page opened from Home, Library, Timeline, or Reports.

It should show:

- Thumbnail, title, channel, and source URL when available.
- Saved date and record date when available.
- Current tag: 기억할 영상, 나중에 복습, or 그냥 저장.
- User memo.
- Related same-day viewing records when available.
- Actions to edit tag, edit memo, open YouTube, and delete the saved memory.

It should not automatically call an AI provider. Optional AI summary belongs behind an explicit user action, quota check, cache, and deletion path.

## Empty And Error States

Library empty state:

- Explain that the user can save a video from YouTube Share.
- Offer the import path only as a backup or reconciliation path.
- Do not imply that importing Takeout is required for daily use.

Filter empty state:

- Explain that no saved videos match the selected filter.
- Offer a way back to all saved videos.

Unsupported share state:

- Explain that the app supports YouTube URLs emitted by YouTube-compatible share flows.
- Do not promise support for every third-party client beyond supported YouTube URL shapes.

## Privacy And Storage

Library data is personal data and must remain local-first by default.

Requirements:

- Saved URLs, notes, titles, and thumbnails must not be uploaded by default.
- Deleting a saved memory must remove its tag and memo.
- Clearing local personal data must clear saved memories and any pending native share payloads.
- Debug logs must not include full URLs, titles, notes, OAuth tokens, or Drive tokens.

## Implementation Order

1. Add Library route or screen shell with static local state wiring only.
2. Add filter state for `all`, `remember`, `review`, and `saved`.
3. Reuse existing `VideoMemory` storage and dedup behavior.
4. Add Video Detail nested route/page.
5. Add edit/delete flows with tests.
6. Add screen evidence before visual polish.
