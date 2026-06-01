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
});
