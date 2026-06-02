import { describe, expect, it } from "vitest";
import { summarizeDay } from "@/lib/analytics/summarizeDay";
import { classifyItems } from "@/lib/classify/classify";
import {
  filterItemsByDateKey,
  getAvailableDates,
  getDateRangeForSelection
} from "@/lib/date/dateKeys";
import { mergeWatchItems } from "@/lib/history/mergeWatchItems";
import { parseTakeoutZip, WATCH_HISTORY_MISSING_TAKEOUT_MESSAGE } from "@/lib/import/parseTakeout";
import { buildDailyReview } from "@/lib/review/buildDailyReview";
import { buildWeeklyReport } from "@/lib/review/buildWeeklyReport";
import {
  buildFallbackHtmlTakeoutFixtureZip,
  buildHtmlTakeoutFixtureZip,
  buildJsonTakeoutFixtureZip,
  buildNoWatchHistoryFixtureZip,
  TAKEOUT_FIXTURE_DATE_SETTINGS
} from "./fixtures/takeoutFixtures";

function dateCounts(items: Parameters<typeof getAvailableDates>[0], settings = TAKEOUT_FIXTURE_DATE_SETTINGS) {
  return getAvailableDates(items, settings).map(({ dateKey, count }) => ({ dateKey, count }));
}

describe("Takeout fixture import flow", () => {
  it("parses a realistic Takeout ZIP with unrelated YouTube files", async () => {
    const parsed = await parseTakeoutZip("takeout-json-fixture.zip", await buildJsonTakeoutFixtureZip());

    expect(parsed.source).toBe("takeout-zip");
    expect(parsed.parserSource).toBe("takeout-json");
    expect(parsed.matchedFileName).toBe("Takeout/YouTube and YouTube Music/history/watch-history.json");
    expect(parsed.archiveEntryCount).toBe(4);
    expect(parsed.items).toHaveLength(5);
    expect(parsed.skippedCount).toBe(1);
    expect(parsed.items.map((item) => item.title)).toEqual([
      "Next.js App Router \uAC15\uC758",
      "React Server Components \uC815\uB9AC",
      "\uBE44\uD2B8\uCF54\uC778 ETF \uC804\uB9DD",
      "Official MV - Summer Night",
      "\uBC1C\uB85C\uB780\uD2B8 \uD558\uC774\uB77C\uC774\uD2B8"
    ]);
  });

  it("falls back to watch-history.html when the preferred JSON candidate is malformed", async () => {
    const parsed = await parseTakeoutZip("takeout-fallback-fixture.zip", await buildFallbackHtmlTakeoutFixtureZip());

    expect(parsed.source).toBe("takeout-zip");
    expect(parsed.parserSource).toBe("takeout-html");
    expect(parsed.matchedFileName).toBe("Takeout/YouTube and YouTube Music/history/watch-history.html");
    expect(parsed.archiveEntryCount).toBe(4);
    expect(parsed.items).toHaveLength(2);
    expect(parsed.items[0]).toMatchObject({
      title: "Official MV - Summer Night",
      channelName: "MUSIC LAB",
      watchedAt: "2026-05-27T14:30:00.000Z"
    });
    expect(parsed.items[1]).toMatchObject({
      title: "YouTube Shorts \uB9AC\uC561\uC158 \uBAA8\uC74C",
      channelName: "\uC9E7\uC740\uD074\uB9BD",
      watchedAt: "2026-05-27T17:10:00.000Z"
    });
  });

  it("merges repeated full exports and preserves date/report behavior", async () => {
    const firstExport = await parseTakeoutZip("first-takeout.zip", await buildJsonTakeoutFixtureZip());
    const secondExport = await parseTakeoutZip("second-takeout.zip", await buildHtmlTakeoutFixtureZip());

    const firstMerge = mergeWatchItems([], firstExport.items);
    const secondMerge = mergeWatchItems(firstMerge.items, secondExport.items);

    expect(firstMerge.addedCount).toBe(5);
    expect(firstMerge.duplicateCount).toBe(0);
    expect(secondMerge.addedCount).toBe(1);
    expect(secondMerge.duplicateCount).toBe(1);
    expect(secondMerge.items).toHaveLength(6);

    expect(dateCounts(secondMerge.items)).toEqual([
      { dateKey: "2026-05-28", count: 2 },
      { dateKey: "2026-05-27", count: 4 }
    ]);

    expect(
      dateCounts(secondMerge.items, {
        ...TAKEOUT_FIXTURE_DATE_SETTINGS,
        boundaryMode: "lifestyle-day"
      })
    ).toEqual([{ dateKey: "2026-05-27", count: 6 }]);

    const dayItems = filterItemsByDateKey(secondMerge.items, "2026-05-27", TAKEOUT_FIXTURE_DATE_SETTINGS);
    const classifiedDayItems = classifyItems(dayItems);
    const dailySummary = summarizeDay(classifiedDayItems, TAKEOUT_FIXTURE_DATE_SETTINGS);
    const dailyReview = buildDailyReview(classifiedDayItems, dailySummary, TAKEOUT_FIXTURE_DATE_SETTINGS);

    expect(dailySummary.totalCount).toBe(4);
    expect(dailySummary.topCategory?.count).toBe(2);
    expect(dailySummary.topChannel?.count).toBe(2);
    expect(dailyReview.timeBlocks.reduce((total, block) => total + block.count, 0)).toBe(4);
    expect(dailyReview.memorableItems).toHaveLength(4);

    const weekRange = getDateRangeForSelection(
      "2026-05-28",
      TAKEOUT_FIXTURE_DATE_SETTINGS,
      "week",
      new Date("2026-05-28T05:00:00.000Z")
    );
    const weeklyReport = buildWeeklyReport(classifyItems(secondMerge.items), TAKEOUT_FIXTURE_DATE_SETTINGS, weekRange);

    expect(weeklyReport.summary.totalCount).toBe(6);
    expect(weeklyReport.dailyCounts.find((day) => day.dateKey === "2026-05-27")?.count).toBe(4);
    expect(weeklyReport.dailyCounts.find((day) => day.dateKey === "2026-05-28")?.count).toBe(2);
    expect(weeklyReport.mostActiveDay?.dateKey).toBe("2026-05-27");
    expect(weeklyReport.memorableItems).toHaveLength(6);
  });

  it("deduplicates the exact same Takeout archive when imported twice", async () => {
    const parsed = await parseTakeoutZip("same-takeout.zip", await buildJsonTakeoutFixtureZip());
    const firstMerge = mergeWatchItems([], parsed.items);
    const secondMerge = mergeWatchItems(firstMerge.items, parsed.items);

    expect(firstMerge.addedCount).toBe(5);
    expect(firstMerge.duplicateCount).toBe(0);
    expect(secondMerge.addedCount).toBe(0);
    expect(secondMerge.duplicateCount).toBe(5);
    expect(secondMerge.items).toHaveLength(5);
  });

  it("fails clearly when a Takeout ZIP has no watch-history candidate", async () => {
    await expect(parseTakeoutZip("empty-takeout.zip", await buildNoWatchHistoryFixtureZip())).rejects.toThrow(
      WATCH_HISTORY_MISSING_TAKEOUT_MESSAGE
    );
    await expect(parseTakeoutZip("empty-takeout.zip", await buildNoWatchHistoryFixtureZip())).rejects.toThrow(
      "archive_browser.html은 Takeout 목차 파일이라 시청 기록으로 사용할 수 없습니다."
    );
  });
});
