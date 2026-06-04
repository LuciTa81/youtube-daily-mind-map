import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const panelPath = join(process.cwd(), "src", "components", "library", "VideoLibraryPanel.tsx");
const appShellPath = join(process.cwd(), "src", "components", "layout", "AppShell.tsx");

function readPanel(): string {
  return readFileSync(panelPath, "utf8");
}

function readAppShell(): string {
  return readFileSync(appShellPath, "utf8");
}

describe("video library panel wiring", () => {
  it("renders the Library as saved-video surface with the required filters", () => {
    const source = readPanel();

    expect(source).toContain("저장함");
    expect(source).toContain("내가 남긴 YouTube 영상");
    expect(source).toContain("filterVideoLibraryItems(items, \"all\")");
    expect(source).toContain("VIDEO_LIBRARY_FILTERS.map");
    expect(source).toContain("getVideoLibraryFilterCount(items, filter.key)");
    expect(source).toContain("공유로 직접 저장했거나");
    expect(source).toContain("타임라인에서 태그와 메모를 남긴 영상");
  });

  it("keeps empty states focused on YouTube share save and settings help", () => {
    const source = readPanel();

    expect(source).toContain("아직 저장한 YouTube 영상이 없습니다.");
    expect(source).toContain("YouTube 공유 버튼에서 이 앱을 선택하면 오늘의 기억으로 저장됩니다.");
    expect(source).toContain("공유 저장 방법 보기");
    expect(source).toContain("onOpenSettings");
  });

  it("wires Library into AppShell without removing supporting mind map access", () => {
    const source = readAppShell();

    expect(source).toContain('import { VideoLibraryPanel } from "@/components/library/VideoLibraryPanel";');
    expect(source).toContain(
      'type CanvasMode = "review" | "library" | "video-detail" | "weekly" | "mindmap" | "timeline" | "settings";'
    );
    expect(source).toContain("const libraryItems = useMemo(() => classifyItems(savedWatchItems), [savedWatchItems]);");
    expect(source).toContain('canvasMode === "library"');
    expect(source).toContain("<VideoLibraryPanel");
    expect(source).toContain("onItemSelect={handleLibraryItemSelect}");
    expect(source).toContain('onClick={() => handleCanvasModeChange("library")}');
    expect(source).toContain("저장함");
    expect(source).toContain('onOpenMindMap={() => handleCanvasModeChange("mindmap")}');
  });

  it("does not introduce unsupported viewing-duration copy", () => {
    const combinedSource = `${readPanel()}\n${readAppShell()}`;

    expect(combinedSource).not.toContain("사용 시간");
    expect(combinedSource).not.toContain("시청 시간");
    expect(combinedSource).not.toContain("watch time");
    expect(combinedSource).not.toContain("usage time");
  });
});
