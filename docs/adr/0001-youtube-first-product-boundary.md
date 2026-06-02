# ADR 0001: Keep The Product YouTube-First

## Status

Accepted

## Context

The broader "life archive" direction is attractive, especially in Korea where KakaoTalk, Naver Map, Samsung Health, photos, and calendars contain important daily context. However, supporting those sources early would increase product scope, privacy burden, policy complexity, and implementation risk.

The current prototype already has YouTube Takeout import, timeline, mind map, daily review, weekly report, and Android-native Drive import foundations.

## Decision

The product will remain YouTube-first until the core loop is validated:

1. Import historical YouTube records through Takeout.
2. Save daily memories through YouTube share.
3. Review a day through timeline and notes.
4. Review a week through reports.
5. Optionally generate AI insights with explicit user action.

Non-YouTube data sources require a new ADR.

## Consequences

- The MVP remains narrow enough to ship and test.
- Privacy communication is simpler.
- Daily usage can be validated before expanding.
- Future architecture still allows additional importers through the importer contract.
