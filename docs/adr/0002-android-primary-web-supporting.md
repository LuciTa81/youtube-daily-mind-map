# ADR 0002: Android Is Primary, Web Is Supporting

## Status

Accepted

## Context

The app handles large Takeout ZIP files, Android file selection, local personal data, YouTube share intents, reminders, and eventually app-store monetization. A pure web app struggles with large files, mobile Drive behavior, persistent local storage expectations, and daily notification/share loops.

The web surface remains useful for landing pages, demos, privacy explanations, Takeout guides, and shared reports.

## Decision

Android is the primary product surface. Web is a supporting surface.

## Consequences

- Native Android import and share flows are product-critical.
- Web should not block Android progress.
- Vercel remains useful for demos and marketing.
- App architecture must keep native integrations behind typed wrappers.
