import { describe, expect, it } from "vitest";
import {
  filterItemsByDateKey,
  getAvailableDates,
  getDateKeyForItem,
  getDateRangeForDateKey
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
});
