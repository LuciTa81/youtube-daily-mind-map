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
  const baseItem: ClassifiedWatchItem = {
    id: "item",
    title: "Next.js App Router 강의",
    channelName: "생활코딩",
    watchedAt: "2026-05-27T10:30:00.000Z",
    source: "sample",
    category: "개발/기술",
    confidence: 0.9
  };

  return {
    ...baseItem,
    ...overrides
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

  it("prioritizes videos explicitly marked for memory or review", () => {
    const items = [
      item({ id: "low-confidence", confidence: 0.2, watchedAt: "2026-05-27T10:00:00.000Z" }),
      item({ id: "review", confidence: 0.95, memoryTag: "review", watchedAt: "2026-05-27T11:00:00.000Z" }),
      item({ id: "remember", confidence: 0.95, memoryTag: "remember", watchedAt: "2026-05-27T12:00:00.000Z" })
    ];
    const summary = summarizeDay(items, settings);
    const review = buildDailyReview(items, summary, settings);

    expect(review.memorableItems.map((memoryItem) => memoryItem.id).slice(0, 3)).toEqual([
      "remember",
      "review",
      "low-confidence"
    ]);
  });

  it("separates user-marked memory items for the daily review screen", () => {
    const items = [
      item({ id: "remember", memoryTag: "remember", confidence: 0.95, watchedAt: "2026-05-27T12:00:00.000Z" }),
      item({ id: "review", memoryTag: "review", confidence: 0.95, watchedAt: "2026-05-27T11:00:00.000Z" }),
      item({ id: "saved", memoryTag: "saved", confidence: 0.1, watchedAt: "2026-05-27T10:00:00.000Z" }),
      item({ id: "plain", confidence: 0.1, watchedAt: "2026-05-27T09:00:00.000Z" })
    ];
    const summary = summarizeDay(items, settings);
    const review = buildDailyReview(items, summary, settings);

    expect(review.markedMemoryItems.map((memoryItem) => memoryItem.id)).toEqual(["remember", "review"]);
  });
});
