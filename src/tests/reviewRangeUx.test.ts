import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const appShellPath = join(process.cwd(), "src", "components", "layout", "AppShell.tsx");
const homeDashboardPath = join(process.cwd(), "src", "components", "layout", "HomeDashboard.tsx");
const watchTimelinePath = join(process.cwd(), "src", "components", "timeline", "WatchTimeline.tsx");

function readSource(path: string): string {
  return readFileSync(path, "utf8").replace(/\r\n/g, "\n");
}

describe("review range UX copy", () => {
  it("keeps the day and recent-week review choices explicit on Home", () => {
    const source = readSource(homeDashboardPath);

    expect(source).toContain("function getReviewRangeGuide(rangeMode: DateRangeMode)");
    expect(source).toContain("하루 회고");
    expect(source).toContain("선택한 날짜 하루의 기록 개수, 집중 시간대, 기억할 영상을 빠르게 정리합니다.");
    expect(source).toContain("최근 7일 회고");
    expect(source).toContain("선택한 날짜까지 최근 7일의 기록 흐름과 반복된 관심사를 함께 봅니다.");
    expect(source).toContain("회고 범위");
    expect(source).toContain("bg-sky-50 px-3 py-2.5");
    expect(source).toContain("mt-2 rounded-full bg-white px-3 py-1");
    expect(source).toContain("하루 타임라인 보기");
    expect(source).toContain("7일 타임라인 보기");
  });

  it("carries the selected review range into the Timeline screen", () => {
    const timelineSource = readSource(watchTimelinePath);
    const appShellSource = readSource(appShellPath);

    expect(timelineSource).toContain("rangeMode?: DateRangeMode");
    expect(timelineSource).toContain("rangeLabel?: string");
    expect(timelineSource).toContain("선택한 날짜 하루의 기록을 시간순으로 이어봅니다.");
    expect(timelineSource).toContain("선택한 날짜까지 최근 7일의 기록을 시간순으로 이어봅니다.");
    expect(timelineSource).toContain('rangeMode === "week" ? "최근 7일치" : "하루치"');
    expect(timelineSource).toContain("mt-2 flex gap-2 overflow-x-auto pb-1");
    expect(timelineSource).toContain("border-b border-slate-200 px-4 py-2.5");
    expect(appShellSource).toContain("rangeMode={rangeMode}");
    expect(appShellSource).toContain("rangeLabel={activeRangeDescription}");
  });

  it("does not imply known watch duration in the review range surfaces", () => {
    const source = `${readSource(homeDashboardPath)}\n${readSource(watchTimelinePath)}`;

    expect(source).not.toContain("사용시간");
    expect(source).not.toContain("사용 시간");
    expect(source).not.toContain("시청 시간");
    expect(source).not.toContain("몇 시간");
  });
});
