import { describe, expect, it } from "vitest";
import { getDateRangeForSelection } from "@/lib/date/dateKeys";
import { buildWeeklyReport } from "@/lib/review/buildWeeklyReport";
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

describe("buildWeeklyReport", () => {
  it("builds a seven-day report with daily counts and category trends", () => {
    const range = getDateRangeForSelection("2026-05-28", settings, "week", new Date("2026-05-28T12:00:00+09:00"));
    const items = [
      item({ id: "a", watchedAt: "2026-05-22T01:00:00.000Z", category: "개발/기술" }),
      item({ id: "b", watchedAt: "2026-05-27T02:00:00.000Z", category: "음악", channelName: "MUSIC LAB", confidence: 0.4 }),
      item({ id: "c", watchedAt: "2026-05-27T03:00:00.000Z", category: "음악", channelName: "MUSIC LAB" })
    ];

    const report = buildWeeklyReport(items, settings, range);

    expect(report.dailyCounts).toHaveLength(7);
    expect(report.summary.totalCount).toBe(3);
    expect(report.summary.topCategory?.name).toBe("음악");
    expect(report.categoryTrends[0]).toMatchObject({
      category: "음악",
      count: 2,
      activeDays: 1
    });
    expect(report.topChannels[0]).toMatchObject({ channelName: "MUSIC LAB", count: 2 });
    expect(report.memorableItems[0].id).toBe("b");
    expect(report.mostActiveDay?.count).toBe(2);
  });

  it("prioritizes videos explicitly marked for memory or review", () => {
    const range = getDateRangeForSelection("2026-05-28", settings, "week", new Date("2026-05-28T12:00:00+09:00"));
    const items = [
      item({ id: "low-confidence", confidence: 0.2, watchedAt: "2026-05-24T10:00:00.000Z" }),
      item({ id: "review", confidence: 0.95, memoryTag: "review", watchedAt: "2026-05-25T10:00:00.000Z" }),
      item({ id: "remember", confidence: 0.95, memoryTag: "remember", watchedAt: "2026-05-26T10:00:00.000Z" })
    ];

    const report = buildWeeklyReport(items, settings, range);

    expect(report.memorableItems.map((memoryItem) => memoryItem.id).slice(0, 3)).toEqual([
      "remember",
      "review",
      "low-confidence"
    ]);
  });

  it("separates user-marked memory items for the weekly report screen", () => {
    const range = getDateRangeForSelection("2026-05-28", settings, "week", new Date("2026-05-28T12:00:00+09:00"));
    const items = [
      item({ id: "remember", memoryTag: "remember", confidence: 0.95, watchedAt: "2026-05-26T10:00:00.000Z" }),
      item({ id: "review", memoryTag: "review", confidence: 0.95, watchedAt: "2026-05-25T10:00:00.000Z" }),
      item({ id: "saved", memoryTag: "saved", confidence: 0.1, watchedAt: "2026-05-24T10:00:00.000Z" }),
      item({ id: "plain", confidence: 0.1, watchedAt: "2026-05-23T10:00:00.000Z" })
    ];

    const report = buildWeeklyReport(items, settings, range);

    expect(report.markedMemoryItems.map((memoryItem) => memoryItem.id)).toEqual(["remember", "review"]);
  });
});
