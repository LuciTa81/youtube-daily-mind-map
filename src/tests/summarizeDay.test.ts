import { describe, expect, it } from "vitest";
import { summarizeDay } from "@/lib/analytics/summarizeDay";
import type { ClassifiedWatchItem, DateSettings } from "@/types/watch";

const settings: DateSettings = {
  timezone: "Asia/Seoul",
  boundaryMode: "calendar-day",
  lifestyleBoundaryHour: 4
};

function item(
  id: string,
  category: string,
  channelName: string,
  watchedAt: string
): ClassifiedWatchItem {
  return {
    id,
    title: id,
    watchedAt,
    source: "sample",
    category,
    channelName,
    confidence: 0.9
  };
}

describe("summarizeDay", () => {
  it("summarizes category, channel, and time block counts", () => {
    const summary = summarizeDay(
      [
        item("a", "개발/기술", "생활코딩", "2026-05-27T08:00:00+09:00"),
        item("b", "개발/기술", "생활코딩", "2026-05-27T09:00:00+09:00"),
        item("c", "음악", "MUSIC LAB", "2026-05-27T20:00:00+09:00")
      ],
      settings
    );

    expect(summary.totalCount).toBe(3);
    expect(summary.topCategory).toEqual({ name: "개발/기술", count: 2, percentage: 67 });
    expect(summary.topChannel).toEqual({ name: "생활코딩", count: 2 });
    expect(summary.topTimeBlock).toEqual({ name: "오전", count: 2 });
  });
});
