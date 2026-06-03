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

function readImportPanel(): string {
  return readFileSync(importPanelPath, "utf8");
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
    expect(source).toContain("공유 시트 첫 화면에 앱이 안 보이면 더보기를 누릅니다.");
    expect(source).toContain("YouTube Daily Mind Map을 선택하면 오늘 기록에 저장됩니다.");
    expect(source).toContain("기기 공유 목록에서 더 빨리 찾을 수 있습니다.");
  });
});
