import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const homeDashboardPath = join(process.cwd(), "src", "components", "layout", "HomeDashboard.tsx");
const watchTimelinePath = join(process.cwd(), "src", "components", "timeline", "WatchTimeline.tsx");

function readHomeDashboard(): string {
  return readFileSync(homeDashboardPath, "utf8");
}

function readWatchTimeline(): string {
  return readFileSync(watchTimelinePath, "utf8");
}

describe("shared memory home UX", () => {
  it("keeps directly shared videos distinct from passive Takeout records on Home", () => {
    const source = readHomeDashboard();

    expect(source).toContain("const sharedMemoryItems = review.sharedMemoryItems.slice(0, 3)");
    expect(source).toContain("const sharedMemoryItemIds = new Set");
    expect(source).toContain("const highlightedMemoryItemIds = new Set");
    expect(source).toContain("직접 저장한 영상");
    expect(source).toContain("YouTube 공유로 남긴 영상입니다.");
    expect(source).toContain("Takeout으로 보충된 기록과 구분해서 다시 볼 수 있습니다.");
    expect(source).toContain("sharedMemoryItems.map((item)");
    expect(source).toContain(".filter((item) => !sharedMemoryItemIds.has(item.id))");
    expect(source).toContain(".filter((item) => !highlightedMemoryItemIds.has(item.id))");
    expect(source).toContain("const memorySummary = getVideoMemorySummary(item)");
    expect(source).toContain("{memorySummary ? (");
  });

  it("keeps saved/shared video memory visible on Timeline cards", () => {
    const source = readWatchTimeline();

    expect(source).toContain("import { getVideoMemorySummary }");
    expect(source).toContain("const memorySummary = getVideoMemorySummary(item)");
    expect(source).toContain("{memorySummary ? (");
    expect(source).toContain("line-clamp-1 rounded-full bg-sky-50");
    expect(source).toContain("{memorySummary}");
    expect(source).not.toContain("?ъ슜 ?쒓컙");
    expect(source).not.toContain("?쒖껌 ?쒓컙");
  });

  it("does not introduce unsupported viewing-duration copy", () => {
    const source = readHomeDashboard();

    expect(source).not.toContain("사용 시간");
    expect(source).not.toContain("시청 시간");
    expect(source).not.toContain("몇 분 봄");
  });

  it("makes the YouTube share-save loop visible before a user has shared videos", () => {
    const source = readHomeDashboard();

    expect(source).toContain("function ShareMemoryPrompt");
    expect(source).toContain("sharedMemoryItems.length === 0");
    expect(source).toContain("YouTube 공유 저장");
    expect(source).toContain("Takeout을 기다리지 않고");
    expect(source).toContain("오늘의 기억에 따로 모입니다");
    expect(source).toContain("공유 방법 보기");
    expect(source).toContain("onOpenSettings");
  });

  it("does not introduce Korean unsupported viewing-duration copy", () => {
    const source = readHomeDashboard();

    expect(source).not.toContain("사용 시간");
    expect(source).not.toContain("사용시간");
    expect(source).not.toContain("시청 시간");
    expect(source).not.toContain("몇 분 봄");
  });
});
