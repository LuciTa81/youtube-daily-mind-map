# Video Detail Information Architecture

This document defines the nested Video Detail surface before implementing a dedicated page. It keeps the app YouTube-first, local-first, and focused on memory review rather than generic video management.

## Purpose

Video Detail is the place where one saved or selected YouTube video becomes inspectable and editable.

It is not a new bottom tab. It is a nested page opened from:

- Home saved-memory preview.
- Library saved-video card.
- Timeline record card.
- Reports recall candidate.
- Mind map video node when that surface is available.

Back navigation must return to the surface that opened it.

## Primary User Questions

The page should answer:

- What video was this?
- Why did I save or mark it?
- When did this record appear in my day?
- Where did it come from: YouTube share, Takeout, manual entry, or sample/demo?
- What can I safely edit or delete?

## Required Content

The first screen should prioritize the video and the user's memory metadata:

1. Thumbnail when available.
2. Title.
3. Channel name or `채널 없음`.
4. Source badge such as `YouTube 공유`, `Takeout`, `수동 추가`, or `샘플`.
5. Local record time using the user's timezone.
6. Saved or last edited date when memory metadata exists.
7. Current memory tag:
   - `기억할 영상`
   - `나중에 복습`
   - `그냥 저장`
8. User memo when present.
9. Open YouTube action when a source URL exists.

Secondary sections may appear below the first screen:

- Same-day related viewing records.
- Category and channel context.
- Report or recall context that brought the user here.
- Optional AI insight card only after explicit user action.

## Edit Boundary

Editing is limited to local memory metadata unless a future ADR expands the scope.

Allowed edits:

- Change memory tag.
- Add, update, or clear the user memo.
- Save the edited timestamp as `memoryUpdatedAt`.

Not allowed in this page:

- Editing Takeout source text.
- Editing original watchedAt values.
- Editing inferred category as if it were a verified fact.
- Bulk editing other records.
- Calling an AI provider automatically.

If category correction becomes a feature, it should be designed separately as a manual classification workflow.

## Delete Boundary

The page must distinguish between deleting a memory and deleting a viewing record.

For a Takeout-backed record that the user marked or annotated:

- `Remove from Library` clears `memoryTag`, `memoryNote`, and `memoryUpdatedAt`.
- The original viewing record remains in Timeline, reports, and date counts because it came from Takeout.
- The UI must not imply that the historical viewing record was erased.

For a manual/shared-only record:

- `Delete saved video` removes the local manual/shared record from Library, Home memory surfaces, Timeline, and reports.
- The action requires confirmation.
- The action does not touch Google Takeout archives, Google Drive files, YouTube accounts, or remote services.

For sample/demo records:

- Deletion should be disabled or clearly treated as a local demo reset.

For all deletion paths:

- No raw URL, title, or memo should be logged.
- The user must have a visible success or failure result.
- The page should return to the previous surface after a successful delete if the current item no longer exists.

## AI Insight Boundary

Video Detail may later offer an optional insight action, but it must stay behind explicit intent.

Rules:

- No automatic summary on page open.
- No automatic summary immediately after share save.
- The action label should make the cost boundary clear, such as `AI 요약 만들기`.
- The app must check quota or credit before a remote AI call.
- The app must cache successful insight for the same input.
- The user must be able to delete persisted AI insight.
- Failure must leave the local memory metadata intact.

## Empty And Error States

Unsupported or incomplete data should stay useful:

- No thumbnail: show a stable thumbnail placeholder.
- No channel: show `채널 없음`.
- No URL: hide the Open YouTube action and explain that the source URL is unavailable.
- Deleted item: show that the item is no longer available and offer a return action.
- Takeout-only item with no memory metadata: offer `저장함에 추가` rather than delete-memory actions.

## Privacy

Video Detail displays personal YouTube memory data, so it must preserve local-first behavior.

Requirements:

- Do not upload titles, URLs, thumbnails, notes, or same-day context by default.
- Do not log full titles, URLs, notes, OAuth tokens, Drive tokens, or native pending-share payloads.
- Keep edit and delete operations in the existing local storage path.
- Keep native share receivers as handoff layers only; persistence should stay in the shared-video save use case.

## Implementation Order

1. Add a typed `VideoDetailContext` or equivalent app-state shape.
2. Route Home, Library, Timeline, Reports, and mind map video nodes into the same detail surface.
3. Reuse existing memory tag and memo editing logic.
4. Add local delete/remove-memory domain functions with tests before adding buttons.
5. Add UI actions for edit, open YouTube, remove from Library, and delete saved video.
6. Add screen evidence before visual polish.
