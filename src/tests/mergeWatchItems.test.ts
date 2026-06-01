import { describe, expect, it } from "vitest";
import { mergeWatchItems } from "@/lib/history/mergeWatchItems";
import { getWatchRecordKey } from "@/lib/history/watchRecordKey";
import type { WatchItem } from "@/types/watch";

function item(overrides: Partial<WatchItem>): WatchItem {
  return {
    id: overrides.id ?? "item",
    title: overrides.title ?? "Next.js App Router 강의",
    url: overrides.url,
    channelName: overrides.channelName ?? "생활코딩",
    watchedAt: overrides.watchedAt ?? "2026-05-27T10:30:00.000Z",
    source: overrides.source ?? "takeout-json"
  };
}

describe("watch history merge", () => {
  it("deduplicates the same video event by video id and watchedAt", () => {
    const existing = [item({ id: "old", url: "https://www.youtube.com/watch?v=abc" })];
    const incoming = [item({ id: "new", url: "https://youtu.be/abc" })];
    const result = mergeWatchItems(existing, incoming);

    expect(result.items).toHaveLength(1);
    expect(result.addedCount).toBe(0);
    expect(result.duplicateCount).toBe(1);
  });

  it("keeps repeat watches of the same video at different times", () => {
    const existing = [item({ id: "first", url: "https://www.youtube.com/watch?v=abc" })];
    const incoming = [
      item({
        id: "second",
        url: "https://www.youtube.com/watch?v=abc",
        watchedAt: "2026-05-28T10:30:00.000Z"
      })
    ];
    const result = mergeWatchItems(existing, incoming);

    expect(result.items).toHaveLength(2);
    expect(result.addedCount).toBe(1);
    expect(result.duplicateCount).toBe(0);
  });

  it("uses title, channel, and watchedAt when a video URL is missing", () => {
    const first = item({ id: "first", url: undefined, title: "비트코인 ETF 전망" });
    const second = item({ id: "second", url: undefined, title: "  비트코인  ETF 전망  " });

    expect(getWatchRecordKey(first)).toBe(getWatchRecordKey(second));

    const result = mergeWatchItems([first], [second]);
    expect(result.items).toHaveLength(1);
    expect(result.duplicateCount).toBe(1);
  });

  it("counts duplicate records inside the incoming batch", () => {
    const incoming = [
      item({ id: "a", url: "https://www.youtube.com/watch?v=abc" }),
      item({ id: "b", url: "https://www.youtube.com/watch?v=abc" })
    ];
    const result = mergeWatchItems([], incoming);

    expect(result.items).toHaveLength(1);
    expect(result.addedCount).toBe(1);
    expect(result.duplicateCount).toBe(1);
  });
});
