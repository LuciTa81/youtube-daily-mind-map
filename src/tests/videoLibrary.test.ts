import { describe, expect, it } from "vitest";
import {
  filterVideoLibraryItems,
  getVideoLibraryFilterCount,
  getVideoLibraryFilterLabel,
  isVideoLibraryItem,
  removeVideoLibraryMemory,
  VIDEO_LIBRARY_FILTERS
} from "@/lib/library/videoLibrary";
import type { ClassifiedWatchItem } from "@/types/watch";

function item(partial: Partial<ClassifiedWatchItem>): ClassifiedWatchItem {
  return {
    id: partial.id ?? "id",
    title: partial.title ?? "Video",
    watchedAt: partial.watchedAt ?? "2026-05-27T10:00:00.000Z",
    source: partial.source ?? "takeout-json",
    category: partial.category ?? "기타",
    confidence: partial.confidence ?? 0.8,
    ...partial
  };
}

describe("video library domain rules", () => {
  it("defines the saved-video filter taxonomy", () => {
    expect(VIDEO_LIBRARY_FILTERS.map((filter) => filter.key)).toEqual([
      "all",
      "remember",
      "review",
      "saved"
    ]);
    expect(getVideoLibraryFilterLabel("all")).toBe("전체");
    expect(getVideoLibraryFilterLabel("remember")).toBe("기억할 영상");
    expect(getVideoLibraryFilterLabel("review")).toBe("나중에 복습");
    expect(getVideoLibraryFilterLabel("saved")).toBe("그냥 저장");
  });

  it("includes direct shares and user-marked Takeout records but excludes passive records", () => {
    expect(isVideoLibraryItem(item({ source: "manual" }))).toBe(true);
    expect(isVideoLibraryItem(item({ source: "takeout-json", memoryTag: "remember" }))).toBe(true);
    expect(isVideoLibraryItem(item({ source: "takeout-html", memoryNote: "다시 보기" }))).toBe(true);
    expect(isVideoLibraryItem(item({ source: "takeout-json" }))).toBe(false);
  });

  it("filters saved videos by user intent", () => {
    const items = [
      item({ id: "manual-no-tag", source: "manual" }),
      item({ id: "remember", memoryTag: "remember" }),
      item({ id: "review", memoryTag: "review" }),
      item({ id: "saved", memoryTag: "saved" }),
      item({ id: "passive" })
    ];

    expect(filterVideoLibraryItems(items, "all").map((entry) => entry.id)).toEqual([
      "manual-no-tag",
      "remember",
      "review",
      "saved"
    ]);
    expect(filterVideoLibraryItems(items, "remember").map((entry) => entry.id)).toEqual(["remember"]);
    expect(filterVideoLibraryItems(items, "review").map((entry) => entry.id)).toEqual(["review"]);
    expect(filterVideoLibraryItems(items, "saved").map((entry) => entry.id)).toEqual([
      "manual-no-tag",
      "saved"
    ]);
  });

  it("sorts by newest saved or marked item first", () => {
    const items = [
      item({
        id: "old-shared",
        source: "manual",
        watchedAt: "2026-05-27T10:00:00.000Z"
      }),
      item({
        id: "recently-marked",
        memoryTag: "remember",
        watchedAt: "2026-05-26T10:00:00.000Z",
        memoryUpdatedAt: "2026-05-28T10:00:00.000Z"
      }),
      item({
        id: "new-shared",
        source: "manual",
        watchedAt: "2026-05-29T10:00:00.000Z"
      })
    ];

    expect(filterVideoLibraryItems(items, "all").map((entry) => entry.id)).toEqual([
      "new-shared",
      "recently-marked",
      "old-shared"
    ]);
  });

  it("returns counts for each filter", () => {
    const items = [
      item({ id: "manual-no-tag", source: "manual" }),
      item({ id: "remember", memoryTag: "remember" }),
      item({ id: "review", memoryTag: "review" }),
      item({ id: "saved", memoryTag: "saved" }),
      item({ id: "passive" })
    ];

    expect(getVideoLibraryFilterCount(items, "all")).toBe(4);
    expect(getVideoLibraryFilterCount(items, "remember")).toBe(1);
    expect(getVideoLibraryFilterCount(items, "review")).toBe(1);
    expect(getVideoLibraryFilterCount(items, "saved")).toBe(2);
  });

  it("clears only Library memory metadata from Takeout-backed records", () => {
    const markedTakeout = item({
      id: "takeout-marked",
      source: "takeout-json",
      memoryTag: "remember",
      memoryNote: "다시 떠올릴 장면",
      memoryUpdatedAt: "2026-05-28T12:00:00.000Z",
      watchedAt: "2026-05-27T23:30:00.000Z",
      title: "Next.js App Router 강의"
    });
    const other = item({ id: "other", source: "manual", memoryTag: "saved" });

    const result = removeVideoLibraryMemory([markedTakeout, other], "takeout-marked");

    expect(result.status).toBe("memory-cleared");
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      id: "takeout-marked",
      source: "takeout-json",
      watchedAt: "2026-05-27T23:30:00.000Z",
      title: "Next.js App Router 강의",
      category: "기타"
    });
    expect(result.items[0]).not.toHaveProperty("memoryTag");
    expect(result.items[0]).not.toHaveProperty("memoryNote");
    expect(result.items[0]).not.toHaveProperty("memoryUpdatedAt");
    expect(result.items[1]).toBe(other);
    expect(markedTakeout.memoryTag).toBe("remember");
  });

  it("keeps Takeout viewing records after memory removal but removes manual shared records entirely", () => {
    const markedTakeout = item({
      id: "takeout-memory",
      source: "takeout-html",
      url: "https://www.youtube.com/watch?v=takeout001",
      channelName: "교육 채널",
      memoryTag: "review",
      memoryNote: "복습 후보",
      memoryUpdatedAt: "2026-05-28T12:00:00.000Z",
      watchedAt: "2026-05-27T23:30:00.000Z"
    });
    const manualShare = item({
      id: "manual-share",
      source: "manual",
      url: "https://youtu.be/shared001",
      memoryTag: "remember",
      memoryNote: "직접 저장"
    });

    const afterTakeoutRemoval = removeVideoLibraryMemory([markedTakeout, manualShare], "takeout-memory");

    expect(afterTakeoutRemoval.status).toBe("memory-cleared");
    expect(afterTakeoutRemoval.items).toHaveLength(2);
    expect(afterTakeoutRemoval.items[0]).toMatchObject({
      id: "takeout-memory",
      source: "takeout-html",
      url: "https://www.youtube.com/watch?v=takeout001",
      channelName: "교육 채널",
      watchedAt: "2026-05-27T23:30:00.000Z"
    });
    expect(afterTakeoutRemoval.items[0]).not.toHaveProperty("memoryTag");
    expect(afterTakeoutRemoval.items[0]).not.toHaveProperty("memoryNote");
    expect(afterTakeoutRemoval.items[0]).not.toHaveProperty("memoryUpdatedAt");
    expect(filterVideoLibraryItems(afterTakeoutRemoval.items, "all").map((entry) => entry.id)).toEqual([
      "manual-share"
    ]);

    const afterManualRemoval = removeVideoLibraryMemory(afterTakeoutRemoval.items, "manual-share");

    expect(afterManualRemoval.status).toBe("record-deleted");
    expect(afterManualRemoval.items.map((entry) => entry.id)).toEqual(["takeout-memory"]);
    expect(filterVideoLibraryItems(afterManualRemoval.items, "all")).toEqual([]);
  });

  it("deletes manual shared records from the Library list", () => {
    const manual = item({
      id: "shared-only",
      source: "manual",
      memoryTag: "review",
      memoryNote: "나중에 정리"
    });
    const takeout = item({ id: "takeout-marked", memoryTag: "saved" });

    const result = removeVideoLibraryMemory([manual, takeout], "shared-only");

    expect(result.status).toBe("record-deleted");
    expect(result.removedItem).toBe(manual);
    expect(result.items.map((entry) => entry.id)).toEqual(["takeout-marked"]);
  });

  it("does not remove unsupported sample records", () => {
    const sample = item({
      id: "sample-memory",
      source: "sample",
      memoryTag: "saved",
      memoryNote: "demo"
    });

    const result = removeVideoLibraryMemory([sample], "sample-memory");

    expect(result.status).toBe("unsupported-source");
    expect(result.items).toEqual([sample]);
  });

  it("returns unchanged items when the Library record is not found", () => {
    const items = [item({ id: "remember", memoryTag: "remember" })];

    const result = removeVideoLibraryMemory(items, "missing");

    expect(result.status).toBe("not-found");
    expect(result.items).toEqual(items);
  });
});
