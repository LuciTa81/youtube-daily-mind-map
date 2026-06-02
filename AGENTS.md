# Agent Harness

This repository is a product candidate, not a scratch prototype. Agents must preserve architecture, privacy guarantees, and test coverage while making changes.

## Required Reading Order

1. `AGENTS.md`
2. `docs/architecture.md`
3. `docs/use-cases.md`
4. `docs/risks.md`
5. Relevant ADRs in `docs/adr/`

## Product Boundary

- The primary product is an Android-installed personal YouTube memory app.
- The web build is a landing, demo, guide, and shared-report surface.
- The app is YouTube-first. Do not expand to KakaoTalk, Naver, photos, health data, or general life archive features without an ADR.
- The core user value is daily and weekly memory, review, and recall. Mind maps are a supporting view, not the only product surface.

## Non-Negotiable Language

- Do not describe analysis as watch time unless real duration data exists.
- Use "watch record count", "viewing records", "focus time block", or Korean equivalents such as "시청 기록 수", "기록 개수", "집중 시간대".
- Do not claim the app knows how long a user watched a video unless the source data provides that duration.

## Privacy Rules

- Default to local-first processing.
- Do not upload raw Takeout files, watch history, titles, URLs, or user notes to a server unless a feature explicitly requires it and a user-facing consent flow exists.
- Avoid broad Google Drive scopes. Prefer user-selected file access.
- Never log full watch-history contents, OAuth tokens, Drive tokens, or user notes.
- Every persisted personal-data feature must have a deletion path.

## Architecture Rules

- Keep domain logic independent from React components.
- React components may orchestrate state and render UI, but parsing, deduplication, date grouping, classification, and report building belong in `src/lib`.
- Native Android behavior belongs in `android/app/src/main/java/...` and must be wrapped by a typed bridge in `src/lib/native`.
- New import paths must follow the importer contract described in `docs/architecture.md`.
- New AI behavior must go through an insight-provider abstraction. Do not call an AI API directly from UI components.

## Testing Rules

Before finishing a feature, run the smallest meaningful verification:

- Pure logic changes: `npm run test`
- Type changes: `npm run typecheck`
- UI or Next changes: `npm run lint` and `npm run build`
- Android/native changes: `npm run build`, `npx cap sync android`, and `android/gradlew assembleDebug`
- Release-level verification: `npm run verify`

Add or update tests when changing:

- Takeout parsing
- Record identity or deduplication
- Date grouping
- Report generation
- AI cost/quota behavior
- Storage migration behavior

## Large File Import Rules

- ZIP files must be streamed or selectively read whenever possible.
- Do not extract whole archives to disk.
- Guard against zip bombs, oversized entries, path traversal, malformed JSON, and invalid HTML.
- Progress UI must expose the current phase and avoid pretending exact progress when only heuristic progress is available.

## Change Discipline

- Prefer narrow changes over broad rewrites.
- Do not rename major concepts without updating docs and tests.
- If product policy is unclear, add an ADR before implementation.
- If a change touches privacy, Drive access, AI calls, payments, or cross-device sync, update `docs/risks.md`.
