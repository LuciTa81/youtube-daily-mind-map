import { describe, expect, it } from "vitest";
import { classifyOne } from "@/lib/classify/classify";
import type { WatchItem } from "@/types/watch";

function item(title: string): WatchItem {
  return {
    id: title,
    title,
    watchedAt: "2026-05-27T10:00:00+09:00",
    source: "sample"
  };
}

describe("classifyOne", () => {
  it("classifies a Next.js lecture as development/tech", () => {
    expect(classifyOne(item("Next.js App Router 강의")).category).toBe("개발/기술");
  });

  it("classifies bitcoin ETF content as economy/investment", () => {
    expect(classifyOne(item("비트코인 ETF 전망")).category).toBe("경제/투자");
  });

  it("classifies Official MV as music", () => {
    expect(classifyOne(item("Official MV - New Single")).category).toBe("음악");
  });
});
