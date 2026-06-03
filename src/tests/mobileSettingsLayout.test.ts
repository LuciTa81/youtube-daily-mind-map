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

  it("keeps the primary Drive ZIP action above secondary guidance", () => {
    const importPanel = readImportPanel();
    const driveZipActionIndex = importPanel.indexOf("Google Drive ZIP 선택");
    const takeoutLinkIndex = importPanel.indexOf("Drive로 Takeout 만들기");
    const helpToggleIndex = importPanel.indexOf("도움말 보기");
    const recommendedFlowIndex = importPanel.indexOf("권장 흐름");
    const shareGuideIndex = importPanel.indexOf("YouTube 공유로 바로 저장");

    expect(importPanel.match(/savedItemCount > 0/g)).toHaveLength(1);
    expect(importPanel).toContain("<details");
    expect(importPanel).toContain("helpDetailsRef");
    expect(importPanel).toContain("onToggle={handleHelpDetailsToggle}");
    expect(importPanel).toContain('scrollIntoView({ block: "center", behavior: "smooth" })');
    expect(driveZipActionIndex).toBeGreaterThan(0);
    expect(takeoutLinkIndex).toBeGreaterThan(0);
    expect(helpToggleIndex).toBeGreaterThan(0);
    expect(recommendedFlowIndex).toBeGreaterThan(0);
    expect(shareGuideIndex).toBeGreaterThan(0);
    expect(driveZipActionIndex).toBeLessThan(takeoutLinkIndex);
    expect(takeoutLinkIndex).toBeLessThan(helpToggleIndex);
    expect(helpToggleIndex).toBeLessThan(recommendedFlowIndex);
    expect(helpToggleIndex).toBeLessThan(shareGuideIndex);
  });
});
