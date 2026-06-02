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
  it("keeps the chooser guidance visible in the import/settings panel", () => {
    const source = readImportPanel();

    expect(source).toContain("YouTube 공유로 바로 저장");
    expect(source).toContain("공유 시트 첫 화면에 앱이 안 보이면 더보기를 누릅니다.");
    expect(source).toContain("YouTube Daily Mind Map을 선택하면 오늘 기록에 저장됩니다.");
    expect(source).toContain("기기 공유 목록에서 더 빨리 찾을 수 있습니다.");
  });
});
