# Use Cases

## UC-01 Import Takeout ZIP

Actor: user

Goal: import YouTube watch-history records from a Google Takeout archive.

Main flow:

1. User selects a local or Drive-hosted Takeout ZIP.
2. App copies or opens the selected file.
3. App scans ZIP entries and finds YouTube watch-history candidates.
4. App parses JSON or HTML watch-history data.
5. App normalizes records into `WatchRecord`.
6. App merges records with existing local records.
7. App reports parsed, added, duplicate, and failed counts.
8. App shows available dates and a review screen.

Failure cases:

- No watch-history file found.
- ZIP is too large or malformed.
- Entry is too large or malformed.
- Import is cancelled.
- Device storage is insufficient.

Verification:

- Same archive imported twice must not duplicate records.
- 1GB+ archives must show progress and not black-screen the app.
- App restart after import must preserve records.

## UC-02 Save YouTube Video From Share

Actor: user

Goal: save one YouTube video into today's memory log without waiting for Takeout.

Main flow:

1. User taps Share in YouTube.
2. User selects this app.
3. App extracts video URL and video id.
4. App stores a `VideoMemory` with date, thumbnail, source URL, and optional note.
5. App marks it as manually saved or shared.

Failure cases:

- URL is not a supported YouTube URL.
- Video id cannot be extracted.
- The same URL was already saved for the same date.

Verification:

- Supports `youtube.com/watch`, `youtu.be`, and Shorts URLs.
- Duplicate shares do not create duplicate memory cards.

## UC-03 Review A Day

Actor: user

Goal: understand and remember what they watched on one date.

Main flow:

1. User opens Home or Timeline.
2. App selects today by default.
3. App shows record count, top category, top channel, focus time block, and timeline.
4. User writes a one-line reflection.
5. User optionally marks videos as recall-worthy.

Verification:

- Empty dates have a meaningful empty state.
- "watch time" is never displayed unless true duration is available.

## UC-04 Generate Weekly Report

Actor: user

Goal: see patterns across a week.

Main flow:

1. User opens Reports.
2. App groups records for the selected week.
3. App shows category movement, channel movement, recall candidates, and a short review.
4. User can export or share a report card.

Verification:

- Works for sparse weeks and dense weeks.
- Does not require AI by default.

## UC-05 Generate Optional AI Insight

Actor: user

Goal: get a higher-quality summary for selected videos or a selected day/week.

Main flow:

1. User explicitly requests an AI summary.
2. App estimates or checks credit/quota.
3. App sends only necessary data.
4. App caches the result.
5. User can delete the result.

Verification:

- No automatic bulk AI calls.
- Same input is not charged repeatedly.
- Failure falls back to local keyword insight.
