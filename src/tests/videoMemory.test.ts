import { describe, expect, it } from "vitest";
import { applyVideoMemoryDraft, getVideoMemorySummary, getVideoMemoryTagLabel } from "@/lib/share/videoMemory";
import type { WatchItem } from "@/types/watch";

function item(overrides: Partial<WatchItem> = {}): WatchItem {
  const baseItem: WatchItem = {
    id: "item-1",
    title: "Shared video",
    url: "https://youtu.be/shared001",
    watchedAt: "2026-06-02T12:00:00.000Z",
    source: "manual"
  };

  return { ...baseItem, ...overrides };
}

describe("video memory draft", () => {
  it("applies a tag and trimmed note to the target item", () => {
    const result = applyVideoMemoryDraft(
      [item(), item({ id: "item-2" })],
      "item-1",
      { tag: "review", note: "  다시 보기  " },
      "2026-06-02T12:30:00.000Z"
    );

    expect(result?.[0]).toMatchObject({
      memoryTag: "review",
      memoryNote: "다시 보기",
      memoryUpdatedAt: "2026-06-02T12:30:00.000Z"
    });
    expect(result?.[1].memoryTag).toBeUndefined();
  });

  it("clears an empty note while keeping the selected tag", () => {
    const result = applyVideoMemoryDraft(
      [item({ memoryTag: "remember", memoryNote: "old note" })],
      "item-1",
      { tag: "saved", note: "   " },
      "2026-06-02T12:30:00.000Z"
    );

    expect(result?.[0].memoryTag).toBe("saved");
    expect(result?.[0].memoryNote).toBeUndefined();
  });

  it("returns undefined when the target item does not exist", () => {
    const result = applyVideoMemoryDraft([item()], "missing", { tag: "remember", note: "note" });

    expect(result).toBeUndefined();
  });

  it("returns Korean labels for known tags", () => {
    expect(getVideoMemoryTagLabel("remember")).toBe("기억할 영상");
    expect(getVideoMemoryTagLabel("review")).toBe("나중에 복습");
    expect(getVideoMemoryTagLabel("saved")).toBe("그냥 저장");
  });

  it("formats a compact memory summary for cards", () => {
    expect(getVideoMemorySummary(item({ memoryTag: "review", memoryNote: "React 훅 다시 보기" }))).toBe(
      "나중에 복습 · React 훅 다시 보기"
    );
    expect(getVideoMemorySummary(item({ memoryTag: "remember" }))).toBe("기억할 영상");
    expect(getVideoMemorySummary(item({ memoryNote: "아이디어 참고" }))).toBe("아이디어 참고");
    expect(getVideoMemorySummary(item())).toBeUndefined();
  });
});
