import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const importLoadingOverlayPath = join(process.cwd(), "src", "components", "import", "ImportLoadingOverlay.tsx");

function readImportLoadingOverlay(): string {
  return readFileSync(importLoadingOverlayPath, "utf8").replace(/\r\n/g, "\n");
}

describe("ImportLoadingOverlay source guards", () => {
  it("explains the Drive provider opening phase before byte progress starts", () => {
    const source = readImportLoadingOverlay();

    expect(source).toContain("function formatElapsed(elapsedMs: number): string");
    expect(source).toContain('return `${seconds}초 경과`;');
    expect(source).toContain('return `Drive 파일 준비 중 · ${totalBytes} · ${formatElapsed(elapsedMs)}`;');
    expect(source).toContain('return "Drive ZIP을 여는 중입니다.";');
    expect(source).toContain("const DRIVE_OPENING_LINES");
    expect(source).toContain("Drive 응답을 기다리고 있습니다.");
    expect(source).toContain("return getActiveDriveOpeningLine(elapsedMs);");
  });

  it("keeps Drive copy loading copy tied to the copying phase", () => {
    const source = readImportLoadingOverlay();

    expect(source).toContain("const DRIVE_COPY_LINES");
    expect(source).toContain("대용량 Takeout을 옮기는 중입니다.");
    expect(source).toContain("아직 정상적으로 복사 중입니다.");
    expect(source).toContain("function getDisplayLoadingLine(");
    expect(source).toContain('if (progress?.phase === "copying")');
    expect(source).toContain("return getActiveDriveCopyLine(elapsedMs);");
    expect(source).toContain('return "Drive에서 ZIP을 앱 캐시로 복사하는 중입니다.";');
    expect(source).toContain("파일 복사 시작 중");
  });

  it("shows explicit status cards for Drive opening, copying, and finalizing phases", () => {
    const source = readImportLoadingOverlay();

    expect(source).toContain("function getPhaseSupportLine(");
    expect(source).toContain("Drive 파일 준비 중");
    expect(source).toContain("복사 단계");
    expect(source).toContain("마무리 반영 중");
    expect(source).toContain("Drive 준비 상태");
    expect(source).toContain("Drive 복사 상태");
    expect(source).toContain("마무리 반영 상태");
    expect(source).toContain("진행률이 잠시 같은 숫자에 머무를 수 있습니다.");
    expect(source).toContain("98% 근처에서 잠시 머무를 수 있습니다.");
  });

  it("keeps finalizing progress below completion until the import is actually complete", () => {
    const source = readImportLoadingOverlay();

    expect(source).toContain('if (progress.phase === "finalizing")');
    expect(source).toContain("return clamp(Math.max(fallbackProgress, progress.percent, 98), 98, 99);");
    expect(source).toContain('const nonCompleteProgressCap = progress?.phase === "finalizing" ? 99 : 98;');
  });
});
