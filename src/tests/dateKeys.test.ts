import { describe, expect, it } from "vitest";
import {
  filterItemsByDateKey,
  filterItemsByDateRange,
  getAvailableDates,
  getDateKeyForItem,
  getDateRangeForDateKey,
  getDateRangeForSelection,
  getQuickDateOptions,
  getRelativeDateKey
} from "@/lib/date/dateKeys";
import type { DateSettings, WatchItem } from "@/types/watch";

const calendarSettings: DateSettings = {
  timezone: "Asia/Seoul",
  boundaryMode: "calendar-day",
  lifestyleBoundaryHour: 4
};

const lifestyleSettings: DateSettings = {
  timezone: "Asia/Seoul",
  boundaryMode: "lifestyle-day",
  lifestyleBoundaryHour: 4
};

function item(id: string, watchedAt: string): WatchItem {
  return {
    id,
    title: `sample ${id}`,
    watchedAt,
    source: "sample"
  };
}

describe("date key utilities", () => {
  it("calculates calendar-day keys in the configured timezone", () => {
    expect(getDateKeyForItem(item("a", "2026-05-27T23:30:00+09:00"), calendarSettings)).toBe(
      "2026-05-27"
    );
    expect(getDateKeyForItem(item("b", "2026-05-28T01:30:00+09:00"), calendarSettings)).toBe(
      "2026-05-28"
    );
  });

  it("calculates lifestyle-day keys with a 04:00 boundary", () => {
    expect(getDateKeyForItem(item("a", "2026-05-27T23:30:00+09:00"), lifestyleSettings)).toBe(
      "2026-05-27"
    );
    expect(getDateKeyForItem(item("b", "2026-05-28T01:30:00+09:00"), lifestyleSettings)).toBe(
      "2026-05-27"
    );
    expect(getDateKeyForItem(item("c", "2026-05-28T04:30:00+09:00"), lifestyleSettings)).toBe(
      "2026-05-28"
    );
  });

  it("returns available dates with counts sorted newest first", () => {
    const items = [
      item("a", "2026-05-27T23:30:00+09:00"),
      item("b", "2026-05-28T01:30:00+09:00"),
      item("c", "2026-05-28T10:00:00+09:00")
    ];

    expect(getAvailableDates(items, calendarSettings).map(({ dateKey, count }) => ({ dateKey, count }))).toEqual([
      { dateKey: "2026-05-28", count: 2 },
      { dateKey: "2026-05-27", count: 1 }
    ]);
    expect(filterItemsByDateKey(items, "2026-05-28", calendarSettings)).toHaveLength(2);
  });

  it("returns a readable date range for lifestyle-day", () => {
    const range = getDateRangeForDateKey("2026-05-27", lifestyleSettings);

    expect(range.startLabel).toBe("2026-05-27 04:00");
    expect(range.endLabel).toBe("2026-05-28 03:59");
  });

  it("builds recent day ranges with today ending at now", () => {
    const now = new Date("2026-05-27T15:30:00+09:00");
    const todayRange = getDateRangeForSelection("2026-05-27", calendarSettings, "day", now);
    const yesterdayRange = getDateRangeForSelection("2026-05-26", calendarSettings, "day", now);

    expect(todayRange.startLabel).toBe("2026-05-27 00:00");
    expect(todayRange.endLabel).toBe("2026-05-27 15:30");
    expect(yesterdayRange.startLabel).toBe("2026-05-26 00:00");
    expect(yesterdayRange.endLabel).toBe("2026-05-26 23:59");
  });

  it("builds a seven-day range ending on the selected date", () => {
    const now = new Date("2026-05-27T15:30:00+09:00");
    const range = getDateRangeForSelection("2026-05-27", calendarSettings, "week", now);

    expect(range.startLabel).toBe("2026-05-21 00:00");
    expect(range.endLabel).toBe("2026-05-27 15:30");
  });

  it("filters by concrete date ranges and counts quick dates", () => {
    const now = new Date("2026-05-27T15:30:00+09:00");
    const items = [
      item("a", "2026-05-27T10:00:00+09:00"),
      item("b", "2026-05-27T20:00:00+09:00"),
      item("c", "2026-05-26T23:00:00+09:00"),
      item("d", "2026-05-25T09:00:00+09:00")
    ];
    const todayRange = getDateRangeForSelection("2026-05-27", calendarSettings, "day", now);
    const quickDates = getQuickDateOptions(items, calendarSettings, now);

    expect(getRelativeDateKey(2, calendarSettings, now)).toBe("2026-05-25");
    expect(filterItemsByDateRange(items, todayRange).map((entry) => entry.id)).toEqual(["a"]);
    expect(quickDates.map(({ label, dateKey, count }) => ({ label, dateKey, count }))).toEqual([
      { label: "오늘", dateKey: "2026-05-27", count: 1 },
      { label: "하루 전", dateKey: "2026-05-26", count: 1 },
      { label: "이틀 전", dateKey: "2026-05-25", count: 1 }
    ]);
  });
});
