import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const importPanelPath = join(process.cwd(), "src", "components", "import", "WatchHistoryImportPanel.tsx");

function readImportPanel(): string {
  return readFileSync(importPanelPath, "utf8").replace(/\r\n/g, "\n");
}

describe("WatchHistoryImportPanel native import error visibility", () => {
  it("keeps a native import outcome card after the picker returns", () => {
    const source = readImportPanel();

    expect(source).toContain("type NativeImportOutcome");
    expect(source).toContain("const [nativeImportOutcome, setNativeImportOutcome]");
    expect(source).toContain('data-testid="native-import-outcome"');
    expect(source).toContain("마지막 Drive 가져오기 결과");
    expect(source).toContain('nativeImportOutcome.kind === "success"');
    expect(source).toContain('nativeImportOutcome.kind === "cancelled"');
  });

  it("keeps native import errors visible in the status area and error box", () => {
    const source = readImportPanel();

    expect(source).toContain("setStatusMessage(message);\n        setErrorMessage(message);");
    expect(source).toContain('setNativeImportOutcome({ kind: "error", message });');
  });

  it("keeps cancelled native picker attempts visible without marking them as errors", () => {
    const source = readImportPanel();

    expect(source).toContain('setNativeImportOutcome({ kind: "cancelled", message: "파일 선택을 취소했습니다." });');
    expect(source).not.toContain('setErrorMessage("파일 선택을 취소했습니다.")');
  });

  it("keeps native Drive completion separate from local store finalization", () => {
    const source = readImportPanel();

    expect(source).toContain('phase: "finalizing"');
    expect(source).toContain("시청 기록을 저장소와 화면에 반영하는 중입니다.");
    expect(source).toContain("setNativeProgress(finalizingProgress);");
    expect(source).toContain("const successMessage = getImportSummaryStatus(summary);");
    expect(source).toContain('setNativeImportOutcome({ kind: "success", message: successMessage });');
    expect(source).toContain('phase: "complete"');
    expect(source).toContain("completedSuccessfully = true;");
  });
});
