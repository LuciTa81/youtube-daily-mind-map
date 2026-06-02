# Harness Engineering Plan

Harness engineering for this repository means designing the environment so an AI coding agent can move quickly without damaging product structure, privacy, or quality.

## Harness Components

| Component | Repository Artifact | Purpose |
| --- | --- | --- |
| Instructions | `AGENTS.md` | Defines product boundaries, privacy rules, architecture rules, and verification rules. |
| Architecture constraints | `docs/architecture.md` | Describes allowed layers and dependency direction. |
| Use cases | `docs/use-cases.md` | Makes expected behavior explicit before implementation. |
| Risk register | `docs/risks.md` | Tracks product, privacy, policy, and technical risks. |
| ADRs | `docs/adr/*.md` | Records major decisions so future agents understand why. |
| Feedback loop | tests, build, Android build | Prevents silent regressions. |

## Required Agent Workflow

1. Read `AGENTS.md`.
2. Identify affected use cases.
3. Check whether an ADR is needed.
4. Implement within the existing layer boundaries.
5. Add or update tests for domain/application logic.
6. Run the smallest meaningful verification.
7. Summarize changed files and remaining risk.

## Verification Ladder

Use the lowest level that proves the change.

1. Unit tests: `npm run test`
2. Typecheck: `npm run typecheck`
3. Lint: `npm run lint`
4. Web build: `npm run build`
5. Full web verification: `npm run verify`
6. Capacitor sync: `npx cap sync android`
7. Android debug build: `android/gradlew assembleDebug`
8. Real-device smoke test for native file import, share intent, and loading UI.

## Quality Gates To Add Later

- Architecture import boundary tests.
- Storage migration tests.
- Android instrumented smoke tests for native Drive import.
- Play Store privacy checklist.

## Current Fixture Coverage

- `src/tests/takeoutFixtureFlow.test.ts` covers realistic Takeout ZIP parsing with unrelated files, malformed preferred JSON fallback to HTML, exact same archive re-import deduplication, missing watch-history failure, calendar-day and lifestyle-day grouping, daily review generation, and weekly report generation.

## Agent Stop Conditions

An agent should stop and ask for product approval before:

- Expanding beyond YouTube data.
- Adding broad Google Drive scopes.
- Uploading raw personal data to a server.
- Adding automatic AI calls.
- Adding payment, ads, analytics, or cross-device sync.
- Changing how original Takeout files are deleted.
