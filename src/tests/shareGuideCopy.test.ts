import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const importPanelPath = join(
  process.cwd(),
  "src",
  "components",
  "import",
  "WatchHistoryImportPanel.tsx"
);
const appShellPath = join(process.cwd(), "src", "components", "layout", "AppShell.tsx");

function readImportPanel(): string {
  return readFileSync(importPanelPath, "utf8");
}

function readAppShell(): string {
  return readFileSync(appShellPath, "utf8");
}

describe("YouTube share guide copy", () => {
  it("keeps local-first Drive import reassurance next to the primary action", () => {
    const source = readImportPanel();
    const driveZipActionIndex = source.indexOf("Google Drive ZIP 선택");
    const localFirstCopyIndex = source.indexOf(
      "앱은 선택한 ZIP 하나만 현재 기기에서 읽고 서버로 업로드하지 않습니다."
    );
    const takeoutLinkIndex = source.indexOf("Drive로 Takeout 만들기");

    expect(driveZipActionIndex).toBeGreaterThan(0);
    expect(localFirstCopyIndex).toBeGreaterThan(0);
    expect(takeoutLinkIndex).toBeGreaterThan(0);
    expect(driveZipActionIndex).toBeLessThan(localFirstCopyIndex);
    expect(localFirstCopyIndex).toBeLessThan(takeoutLinkIndex);
    expect(source).toContain("파일은 서버로 업로드하지 않습니다.");
    expect(source).not.toContain("사용시간");
    expect(source).not.toContain("시청 시간");
  });

  it("keeps the chooser guidance visible in the import/settings panel", () => {
    const source = readImportPanel();

    expect(source).toContain("도움말 보기");
    expect(source).toContain("Takeout 만들기와 YouTube 공유 저장 방법");
    expect(source).toContain("권장 흐름");
    expect(source).toContain("YouTube 공유로 바로 저장");
    expect(source).toContain("첫 공유 패널에 앱이 안 보이면 더보기를 누릅니다.");
    expect(source).toContain("Android 공유 목록에서도 안 보이면 더보기로 전체 앱 목록을 엽니다.");
    expect(source).toContain(
      "YouTube Daily Mind Map을 선택하면 오늘 기록에 저장되고, 같은 날짜의 같은 영상은 중복으로 만들지 않습니다."
    );
    expect(source).toContain("나중에 홈과 타임라인에서 수정할 수 있습니다.");
    expect(source).toContain("기기 공유 목록에 더 빨리 나타날 수 있습니다.");
  });

  it("keeps share save, duplicate, and memo status copy action-oriented", () => {
    const source = readAppShell();

    expect(source).toContain("오늘 기록에 저장했습니다. 태그와 메모를 남기면 하루 회고에 함께 보입니다.");
    expect(source).toContain("이미 같은 날짜에 저장된 영상입니다. 기존 태그와 메모를 확인하세요.");
    expect(source).toContain("태그와 메모를 기기 안에 저장했습니다.");
    expect(source).toContain("저장된 기록");
    expect(source).not.toContain("공유한 영상을 오늘의 기록에 저장했습니다.");
    expect(source).not.toContain("영상 메모를 저장했습니다.");
    expect(source).not.toContain("사용 시간");
    expect(source).not.toContain("시청 시간");
  });
});
