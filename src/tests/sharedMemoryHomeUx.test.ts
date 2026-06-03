import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const homeDashboardPath = join(process.cwd(), "src", "components", "layout", "HomeDashboard.tsx");

function readHomeDashboard(): string {
  return readFileSync(homeDashboardPath, "utf8");
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
  });

  it("does not introduce unsupported viewing-duration copy", () => {
    const source = readHomeDashboard();

    expect(source).not.toContain("사용 시간");
    expect(source).not.toContain("시청 시간");
    expect(source).not.toContain("몇 분 봄");
  });
});
