import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const importPanelPath = join(process.cwd(), "src", "components", "import", "WatchHistoryImportPanel.tsx");

function readImportPanel(): string {
  return readFileSync(importPanelPath, "utf8");
}

describe("import surface source-order evidence", () => {
  it("keeps the browser file action before secondary guidance in source order", () => {
    const source = readImportPanel();
    const primaryActionIndex = source.indexOf("ZIP/파일 선택");
    const localFirstIndex = source.indexOf("파일은 서버로 업로드하지 않습니다.");
    const takeoutLinkIndex = source.indexOf("Drive로 Takeout 만들기");
    const helpIndex = source.indexOf("도움말 보기");
    const webDrivePanelIndex = source.indexOf("<DriveTakeoutImportPanel");

    expect(primaryActionIndex).toBeGreaterThan(0);
    expect(localFirstIndex).toBeGreaterThan(primaryActionIndex);
    expect(takeoutLinkIndex).toBeGreaterThan(localFirstIndex);
    expect(helpIndex).toBeGreaterThan(takeoutLinkIndex);
    expect(webDrivePanelIndex).toBeGreaterThan(helpIndex);
  });

  it("keeps the native Drive action local-first before Takeout guidance", () => {
    const source = readImportPanel();
    const nativeActionIndex = source.indexOf("Google Drive ZIP 선택");
    const localFirstIndex = source.indexOf("앱은 선택한 ZIP 하나만 현재 기기에서 읽고 서버로 업로드하지 않습니다.");
    const takeoutLinkIndex = source.indexOf("Drive로 Takeout 만들기");

    expect(nativeActionIndex).toBeGreaterThan(0);
    expect(localFirstIndex).toBeGreaterThan(nativeActionIndex);
    expect(takeoutLinkIndex).toBeGreaterThan(localFirstIndex);
  });

  it("keeps the import surface local-first and viewing-record based", () => {
    const source = readImportPanel();

    expect(source).toContain("Takeout 가져오기");
    expect(source).toContain("현재 데이터");
    expect(source).toContain('총 {itemCount.toLocaleString("ko-KR")}개 기록');
    expect(source).toContain('저장된 내 기록 {savedItemCount.toLocaleString("ko-KR")}개');
    expect(source).toContain("앱은 선택한 ZIP 하나만 현재 기기에서 읽고 서버로 업로드하지 않습니다.");
    expect(source).toContain("웹에서는 ZIP, watch-history.json, watch-history.html을 선택할 수 있습니다.");
    expect(source).not.toContain("사용 시간");
    expect(source).not.toContain("시청 시간");
  });
});
