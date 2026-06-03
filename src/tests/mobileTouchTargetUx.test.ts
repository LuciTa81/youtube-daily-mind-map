import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const globalsPath = join(process.cwd(), "src", "app", "globals.css");
const appShellPath = join(process.cwd(), "src", "components", "layout", "AppShell.tsx");
const dateListPath = join(process.cwd(), "src", "components", "date", "DateList.tsx");
const watchHistoryImportPanelPath = join(
  process.cwd(),
  "src",
  "components",
  "import",
  "WatchHistoryImportPanel.tsx"
);
const driveTakeoutImportPanelPath = join(
  process.cwd(),
  "src",
  "components",
  "import",
  "DriveTakeoutImportPanel.tsx"
);
const homeDashboardPath = join(process.cwd(), "src", "components", "layout", "HomeDashboard.tsx");
const watchTimelinePath = join(process.cwd(), "src", "components", "timeline", "WatchTimeline.tsx");

function readSource(path: string): string {
  return readFileSync(path, "utf8").replace(/\r\n/g, "\n");
}

describe("mobile touch target UX", () => {
  it("keeps shared touch sizing utilities at the 44px mobile minimum", () => {
    const source = readSource(globalsPath);

    expect(source).toContain(".touch-target");
    expect(source).toContain(".touch-chip");
    expect(source).toContain(".touch-link");
    expect(source).toContain(".touch-number");
    expect(source.match(/min-height: 2\.75rem;/g)?.length).toBeGreaterThanOrEqual(4);
    expect(source.match(/min-width: 2\.75rem;/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it("applies shared touch sizing to compact home and settings controls", () => {
    const appShell = readSource(appShellPath);
    const home = readSource(homeDashboardPath);
    const dateList = readSource(dateListPath);
    const importPanel = readSource(watchHistoryImportPanelPath);
    const driveImportPanel = readSource(driveTakeoutImportPanelPath);

    expect(appShell).toContain("touch-chip shrink-0 rounded-full bg-white/15");
    expect(home).toContain("touch-chip shrink-0 rounded-full");
    expect(home).toContain("touch-chip rounded-md px-3 py-2 text-xs font-bold");
    expect(home).toContain("shadow-sm touch-chip");
    expect(home).toContain("touch-link shrink-0 text-xs font-bold text-sky-700");
    expect(home).toContain("touch-link text-xs font-bold text-sky-600");
    expect(dateList).toContain("touch-chip rounded-md px-3 py-2 text-xs font-semibold");
    expect(importPanel).toContain("touch-chip flex w-full items-center justify-center");
    expect(importPanel).toContain("touch-chip rounded-md border border-slate-200");
    expect(driveImportPanel).toContain("touch-chip flex items-center justify-center rounded-md");
    expect(driveImportPanel).toContain("touch-chip rounded-md bg-slate-900");
    expect(driveImportPanel).toContain("touch-chip w-full rounded-md border border-rose-200");
  });

  it("keeps timeline index controls 44px wide and offsets mobile cards accordingly", () => {
    const source = readSource(watchTimelinePath);

    expect(source).toContain("touch-number relative z-10 flex h-11 w-11");
    expect(source).toContain("relative space-y-4 pl-12");
    expect(source).toContain("absolute bottom-0 left-[21px] top-0");
    expect(source).toContain("touch-number absolute -left-12 top-3 z-10 flex h-11 w-11");
  });
});
