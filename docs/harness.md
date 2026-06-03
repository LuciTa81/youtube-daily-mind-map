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
| Design QA | `docs/checklists/design-qa.md` | Keeps UI changes grounded in screen evidence, mobile constraints, hierarchy, and product polish. |
| Feedback loop | tests, build, Android build | Prevents silent regressions. |

## Required Agent Workflow

1. Read `AGENTS.md`.
2. Identify affected use cases.
3. Check whether an ADR is needed.
4. Implement within the existing layer boundaries.
5. For UI changes, use `docs/checklists/design-qa.md` and gather screen evidence before visual edits when possible.
6. Add or update tests for domain/application logic.
7. Run the smallest meaningful verification.
8. Summarize changed files and remaining risk.

## Verification Ladder

Use the lowest level that proves the change.

1. Unit tests: `npm run test`
2. Typecheck: `npm run typecheck`
3. Lint: `npm run lint`
4. Web build: `npm run build`
5. Full web verification: `npm run verify`
6. Design QA smoke for UI/layout changes using `docs/checklists/design-qa.md`, including 360px to 430px mobile evidence when possible.
7. Capacitor sync: `npx cap sync android`
8. Android debug build: `android/gradlew assembleDebug`
9. Real-device smoke test for native file import, share intent, deletion, loading UI, and release logcat privacy using `docs/checklists/android-smoke-test.md`.

## Quality Gates To Add Later

- Architecture import boundary tests.
- Storage migration tests.
- Android instrumented smoke tests for native Drive import.
- Visual regression screenshots for Home, Import, Timeline, Report, and Mind Map screens.
- Play Store privacy checklist.

## Current Fixture Coverage

- `src/tests/takeoutFixtureFlow.test.ts` covers realistic Takeout ZIP parsing with unrelated files, malformed preferred JSON fallback to HTML, exact same archive re-import deduplication, missing watch-history failure, calendar-day and lifestyle-day grouping, daily review generation, and weekly report generation.

## Agent Stop Conditions

An agent should stop and ask for product approval before:

- Expanding beyond YouTube data.
- Adding broad Google Drive scopes.
- Uploading raw personal data to a server.
- Adding automatic AI calls.
- Making speculative visual-only UI/CSS changes without screenshot, browser, DOM, or device evidence.
- Adding payment, ads, analytics, or cross-device sync.
- Changing how original Takeout files are deleted.
