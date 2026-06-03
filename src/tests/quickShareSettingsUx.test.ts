import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const appShellPath = join(process.cwd(), "src", "components", "layout", "AppShell.tsx");
const leftPanelPath = join(process.cwd(), "src", "components", "layout", "LeftPanel.tsx");
const settingsRepositoryPath = join(process.cwd(), "src", "lib", "storage", "userSettingsRepository.ts");

function readSource(path: string): string {
  return readFileSync(path, "utf8");
}

describe("quick share save settings UX", () => {
  it("keeps the quick share save toggle local and opt-in", () => {
    const appShell = readSource(appShellPath);
    const repository = readSource(settingsRepositoryPath);

    expect(appShell).toContain("localUserSettingsRepository.load()");
    expect(appShell).toContain("localUserSettingsRepository.save(nextSettings)");
    expect(appShell).toContain("quickShareSaveEnabled: userSettings.quickShareSaveEnabled");
    expect(appShell).toContain("onQuickShareSaveEnabledChange: handleQuickShareSaveEnabledChange");
    expect(repository).toContain("DEFAULT_USER_SETTINGS");
    expect(repository).toContain("quickShareSaveEnabled: false");
    expect(repository).toContain("youtube-daily-mind-map:user-settings:v1");
    expect(repository).not.toContain("indexedDB.open");
  });

  it("keeps the settings panel honest about experimental behavior and AI cost", () => {
    const leftPanel = readSource(leftPanelPath);

    expect(leftPanel).toContain("QuickShareSettingsPanel");
    expect(leftPanel).toContain("quickShareSaveEnabled");
    expect(leftPanel).toContain("onQuickShareSaveEnabledChange");
    expect(leftPanel).toContain("AI 요약은 자동 실행하지 않습니다");
    expect(leftPanel).toContain("공유 후 짧게 보관하고");
    expect(leftPanel).toContain("앱을 열 때 오늘 기록에 반영합니다");
    expect(leftPanel).toContain('aria-label="빠른 저장 모드"');
    expect(leftPanel).toContain("h-11 w-16");
    expect(leftPanel).not.toContain("watch time");
    expect(leftPanel).not.toContain("usage time");
  });
});
