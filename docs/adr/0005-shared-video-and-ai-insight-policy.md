# ADR 0005: Shared Video Save And Optional AI Insight Policy

## Status

Proposed

## Context

The product needs a daily loop that is easier than waiting for Google Takeout. A YouTube share action is a high-intent signal: the user intentionally sends one video to the app because they want to remember it. Google Takeout remains useful as a reconciliation source for videos the user watched but did not share.

AI summaries can make saved videos more memorable, but automatic per-video summarization creates cost, quota, consent, and privacy risks. A user can share many videos in one day, and Takeout can contain hundreds or thousands of records. The app also cannot claim to summarize full video content from title and URL metadata alone; content-level summaries require transcript or equivalent content access.

## Decision

Shared YouTube videos are saved immediately as `VideoMemory` records or equivalent shared-memory records. The saved record may include URL, video id, title, thumbnail, channel metadata, saved date, optional note, and optional tag when those fields are available.

Shared videos should be visible as intentional memories: home recall candidates, timeline badges or filters, daily review items, and detail surfaces may distinguish them from passively imported Takeout records.

Takeout imports remain a reconciliation path for watched records that were not shared. Takeout records can enrich daily and weekly reports, but the app must not automatically summarize every Takeout record.

AI insights are optional by default. The default flow is:

1. Save the shared video immediately.
2. Apply local classification or keyword insight when available.
3. Show a user-triggered summarize action when remote or paid AI is available.

Future premium behavior may allow automatic summaries only behind an explicit user setting, daily quota, cost guardrail, and visible opt-out. The setting must not silently summarize all Takeout records.

Remote AI calls must go through the `VideoInsightProvider` abstraction. UI components must not call an AI API directly.

The same normalized input should not be charged repeatedly. The app should cache insights by stable video/content identity where practical, while keeping watch-event history and user notes deletable.

Only necessary fields may be sent to a remote provider. Title-only or metadata-only insight must be labeled as metadata-based and must not be presented as a full video-content summary. Transcript-based summaries require transcript or equivalent content access plus user intent or an explicit paid-auto setting.

## Alternatives Considered

- Automatically summarize every shared video: rejected for early product because it can burn credits quickly, creates consent ambiguity, and turns a simple save action into a paid remote call.
- Automatically summarize all Takeout records: rejected because Takeout is often large, noisy, and not a high-intent signal for summary quality.
- Never offer AI insight: safer and cheaper, but weakens paid-value candidates such as recall, weekly reports, and searchable memory.
- Local model only: attractive for privacy in the future, but not the default MVP path because model quality, installation size, device performance, and maintenance are not yet validated.

## Consequences

This keeps the daily save flow fast and predictable while preserving AI as a paid-value feature. It also makes cost control easier: remote summaries can be quota-limited, cached, and requested only when the user sees value.

The tradeoff is that the app feels less magical than instant automatic summaries. Product copy and UI need to explain that saving is immediate, while richer insight is available on request or through a future explicit setting.

This decision enables a free tier that stores shared memories and Takeout records, plus a future premium tier for AI insight, richer reports, export, and search.

## Verification

- Tests should keep this ADR visible and aligned with the architecture and use-case documents.
- Future implementation tests must prove that share saving does not automatically call remote AI.
- Future implementation tests must prove that Takeout import does not automatically summarize every record.
- Future implementation tests must prove that repeated requests for the same normalized input use cache or quota-safe behavior.
- Future implementation tests must prove that users can delete persisted AI insight.
- Future UI copy must not present title-only or metadata-only insight as a full video-content summary.
