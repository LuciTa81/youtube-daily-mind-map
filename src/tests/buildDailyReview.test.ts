import { describe, expect, it } from "vitest";
import { summarizeDay } from "@/lib/analytics/summarizeDay";
import { buildDailyReview } from "@/lib/review/buildDailyReview";
import type { ClassifiedWatchItem, DateSettings } from "@/types/watch";

const settings: DateSettings = {
  timezone: "Asia/Seoul",
  boundaryMode: "calendar-day",
  lifestyleBoundaryHour: 4
};

function item(overrides: Partial<ClassifiedWatchItem>): ClassifiedWatchItem {
  return {
    id: overrides.id ?? "item",
    title: overrides.title ?? "Next.js App Router 강의",
    channelName: overrides.channelName ?? "생활코딩",
    watchedAt: overrides.watchedAt ?? "2026-05-27T10:30:00.000Z",
    source: overrides.source ?? "sample",
    category: overrides.category ?? "개발/기술",
    subcategory: overrides.subcategory,
    confidence: overrides.confidence ?? 0.9,
    url: overrides.url
  };
}

describe("buildDailyReview", () => {
  it("builds a review headline, time blocks, and memorable items", () => {
    const items = [
      item({ id: "a", watchedAt: "2026-05-27T01:30:00.000Z", category: "개발/기술", confidence: 0.9 }),
      item({ id: "b", watchedAt: "2026-05-27T12:30:00.000Z", category: "음악", confidence: 0.45 }),
      item({ id: "c", watchedAt: "2026-05-27T13:30:00.000Z", category: "음악", confidence: 0.8 })
    ];
    const summary = summarizeDay(items, settings);
    const review = buildDailyReview(items, summary, settings);

    expect(review.headline).toContain("음악");
    expect(review.insight).toContain("음악");
    expect(review.focusKeywords).toContain("음악");
    expect(review.timeBlocks.length).toBeGreaterThan(0);
    expect(review.memorableItems[0].id).toBe("b");
  });
});
