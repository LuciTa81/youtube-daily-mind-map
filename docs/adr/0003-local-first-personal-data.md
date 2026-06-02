# ADR 0003: Local-First Personal Data

## Status

Accepted

## Context

YouTube watch history, notes, and AI insights are sensitive personal data. User trust is a core product requirement and a likely launch attack surface.

## Decision

Raw Takeout archives and normalized watch records are processed locally by default. Server upload, cloud sync, AI analysis, analytics, or sharing requires explicit product design and user consent.

## Consequences

- The app can make a strong privacy claim.
- Cross-device sync is deferred.
- AI features must be opt-in and minimal-data.
- Every personal-data storage feature must provide deletion.
