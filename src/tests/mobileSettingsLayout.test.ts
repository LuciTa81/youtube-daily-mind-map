import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const appShellPath = join(process.cwd(), "src", "components", "layout", "AppShell.tsx");
const importPanelPath = join(process.cwd(), "src", "components", "import", "WatchHistoryImportPanel.tsx");

function readAppShell(): string {
  return readFileSync(appShellPath, "utf8");
}

function readImportPanel(): string {
  return readFileSync(importPanelPath, "utf8");
}

describe("mobile settings layout", () => {
  it("keeps extra bottom spacing for settings above the fixed bottom nav", () => {
    const appShell = readAppShell();

    expect(appShell).toContain('const defaultBottomPaddingClass = "pb-24"');
    expect(appShell).toContain("const settingsBottomPaddingClass");
    expect(appShell).toContain("env(safe-area-inset-bottom,0px)");
    expect(appShell).toContain("var(--native-safe-area-bottom,0px)");
    expect(appShell).toContain('canvasMode === "settings" ? settingsBottomPaddingClass : defaultBottomPaddingClass');
  });

  it("keeps the saved-record delete action above the share guide card", () => {
    const importPanel = readImportPanel();
    const deleteActionIndex = importPanel.indexOf("저장 기록 삭제");
    const shareGuideIndex = importPanel.indexOf("YouTube 공유로 바로 저장");

    expect(importPanel.match(/savedItemCount > 0/g)).toHaveLength(1);
    expect(deleteActionIndex).toBeGreaterThan(0);
    expect(shareGuideIndex).toBeGreaterThan(0);
    expect(deleteActionIndex).toBeLessThan(shareGuideIndex);
  });
});
