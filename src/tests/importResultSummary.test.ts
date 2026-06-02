import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const appShellPath = join(process.cwd(), "src", "components", "layout", "AppShell.tsx");
const driveImportPanelPath = join(process.cwd(), "src", "components", "import", "DriveTakeoutImportPanel.tsx");
const homeDashboardPath = join(process.cwd(), "src", "components", "layout", "HomeDashboard.tsx");
const importSummaryCardPath = join(process.cwd(), "src", "components", "import", "ImportSummaryCard.tsx");
const watchImportPanelPath = join(process.cwd(), "src", "components", "import", "WatchHistoryImportPanel.tsx");
const watchTypesPath = join(process.cwd(), "src", "types", "watch.ts");

function readSource(path: string): string {
  return readFileSync(path, "utf8").replace(/\r\n/g, "\n");
}

describe("import result summary harness", () => {
  it("defines the persisted import summary contract", () => {
    const source = readSource(watchTypesPath);

    expect(source).toContain("export type WatchHistoryImportSummary");
    expect(source).toContain("readCount: number");
    expect(source).toContain("addedCount: number");
    expect(source).toContain("duplicateCount: number");
    expect(source).toContain("savedCount: number");
    expect(source).toContain("persisted: boolean");
  });

  it("returns and stores merge counts from the AppShell import application step", () => {
    const source = readSource(appShellPath);

    expect(source).toContain("function buildImportSummary(");
    expect(source).toContain("readCount: result.items.length");
    expect(source).toContain("addedCount: mergeResult.addedCount");
    expect(source).toContain("duplicateCount: mergeResult.duplicateCount");
    expect(source).toContain("savedCount: mergeResult.items.length");
    expect(source).toContain("const [latestImportSummary, setLatestImportSummary]");
    expect(source).toContain("setLatestImportSummary(importSummary)");
    expect(source).toContain("latestImportSummary={latestImportSummary}");
    expect(source).toContain("return importSummary;");
  });

  it("keeps the latest import summary visible on the home dashboard", () => {
    const source = readSource(homeDashboardPath);

    expect(source).toContain("latestImportSummary?: WatchHistoryImportSummary");
    expect(source).toContain("latestImportSummary ? <ImportSummaryCard summary={latestImportSummary} /> : null");
  });

  it("passes the latest import summary back into the settings import panel", () => {
    const source = readSource(watchImportPanelPath);

    expect(source).toContain("getImportSummaryStatus(summary)");
    expect(source).toContain("setImportSummary(summary)");
    expect(source).toContain("visibleImportSummary");
    expect(source).toContain("latestImportSummary?: WatchHistoryImportSummary");
  });

  it("renders read, added, duplicate, and saved counts in the shared summary card", () => {
    const source = readSource(importSummaryCardPath);

    expect(source).toContain("읽은 기록");
    expect(source).toContain("새로 추가");
    expect(source).toContain("중복 건너뜀");
    expect(source).toContain("저장된 기록");
  });

  it("shows merge counts in the web Drive import panel", () => {
    const source = readSource(driveImportPanelPath);

    expect(source).toContain("const appliedSummary = await onImported");
    expect(source).toContain("addedCount: appliedSummary.addedCount");
    expect(source).toContain("duplicateCount: appliedSummary.duplicateCount");
    expect(source).toContain("savedCount: appliedSummary.savedCount");
    expect(source).toContain("읽은 기록");
    expect(source).toContain("새로 추가");
    expect(source).toContain("중복 건너뜀");
  });
});
