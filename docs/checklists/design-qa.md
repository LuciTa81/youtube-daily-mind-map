# Design QA Checklist

Use this checklist whenever a change touches screen layout, spacing, typography, color, cards, buttons, loading states, empty states, or mobile interaction.

This checklist is a product-quality guardrail. It does not replace screenshots, real-device checks, or user review.

## Required Screen Evidence

- Capture or inspect the affected screen before making visual changes when possible.
- For web UI, prefer at least one mobile viewport between 360px and 430px wide.
- For broad layout changes, also check a desktop viewport.
- For Android UI, prefer a real-device or emulator screenshot when the change affects installed-app behavior.
- Record the viewport or device used in the final summary.
- Do not change UI/CSS based only on source-code guesswork when screen evidence is unavailable. Stop and report the limitation instead.

## Mobile First

- No horizontal scrolling at 360px width unless the component is intentionally scrollable.
- Primary actions are visible in the first viewport or within one natural scroll.
- Touch targets are at least 44px tall or wide for buttons, tabs, and icon actions.
- Bottom navigation and floating actions respect safe-area and browser chrome constraints.
- Important status, import, and error messages remain visible without covering the main action.
- Korean copy wraps naturally and does not clip, overlap, or force awkward one-word lines.
- Foldable layouts are useful coverage, but standard non-foldable Android phone coverage is still required before broad sharing.

## Visual Hierarchy

- Screen title, section title, body text, helper text, and metadata have distinct sizes and weights.
- The primary user action is visually stronger than secondary links, helper cards, or filters.
- Cards are not stacked inside other cards unless the nested card is a modal or a repeated item.
- Repeated cards have consistent padding, border radius, border, and shadow treatment.
- Dense screens should favor scanning and comparison over decorative hero-style composition.
- Mind map views are supporting surfaces; daily review, timeline, import, and report screens should remain easy to understand without canvas familiarity.

## Product Polish

- Use shared UI patterns or design tokens before adding one-off colors, radii, shadows, or spacing.
- Prefer restrained SaaS-style color with clear category accents over a one-note palette.
- Empty states explain the next action, not just that data is missing.
- Error states explain the cause and the next safe action.
- Loading states show the current phase and do not pretend exact progress when only heuristic progress is available.
- Video and review surfaces must not claim viewing duration unless source data provides real duration.
- Avoid raw developer terms in user-facing Korean copy unless the user needs that technical detail.

## Evidence Template

Include this evidence in the final summary for UI changes when possible:

- Screen or component:
- Viewport or device:
- Evidence used: screenshot, browser inspection, DOM text, Android screenshot, or explicit limitation:
- Main visual issue:
- Change made:
- Remaining visual risk:

## No-Go Conditions

Stop before changing UI and report the next recommended task when:

- No screenshot, browser inspection, DOM text, or device evidence is available for a visual-only change.
- The change could hide the primary action on a 360px to 430px mobile viewport.
- The change would add a new visual system without shared tokens or components.
- The copy could imply watch time, usage time, or known viewing duration without duration data.
- The evidence would require logging or committing personal data, raw Takeout contents, OAuth tokens, screenshots with sensitive data, or full video URLs.
