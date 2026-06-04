import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const detailPagePath = join(process.cwd(), "src", "components", "library", "VideoDetailPage.tsx");
const appShellPath = join(process.cwd(), "src", "components", "layout", "AppShell.tsx");

function readDetailPage(): string {
  return readFileSync(detailPagePath, "utf8");
}

function readAppShell(): string {
  return readFileSync(appShellPath, "utf8");
}

describe("video detail page shell", () => {
  it("renders a saved-video detail surface with local tag and memo editing", () => {
    const source = readDetailPage();

    expect(source).toContain("export function VideoDetailPage");
    expect(source).toContain("VideoMemoryEditForm");
    expect(source).toContain("VIDEO_MEMORY_TAG_OPTIONS.map");
    expect(source).toContain("getVideoMemorySummary(item)");
    expect(source).toContain("getVideoLibraryFilterLabel(item.memoryTag ?? \"saved\")");
    expect(source).toContain("formatDateTime(item.watchedAt, dateSettings.timezone)");
    expect(source).toContain("formatDateTime(item.memoryUpdatedAt, dateSettings.timezone)");
    expect(source).toContain("getVideoMetadata(item)");
    expect(source).toContain("onSave(item.id, { tag, note })");
    expect(source).toContain("YouTube");
  });

  it("labels sources without broadening beyond YouTube-first import types", () => {
    const source = readDetailPage();

    expect(source).toContain('item.source === "manual"');
    expect(source).toContain('item.source === "sample"');
    expect(source).toContain("Takeout");
    expect(source).not.toContain("Kakao");
    expect(source).not.toContain("Naver");
  });

  it("wires Library cards into a nested page rather than a new bottom tab", () => {
    const source = readAppShell();

    expect(source).toContain('import { VideoDetailPage } from "@/components/library/VideoDetailPage";');
    expect(source).toContain('type CanvasMode = "review" | "library" | "video-detail"');
    expect(source).toContain("const [selectedVideoDetailItemId, setSelectedVideoDetailItemId]");
    expect(source).toContain("const selectedVideoDetailItem = useMemo");
    expect(source).toContain("const handleLibraryItemSelect = useCallback");
    expect(source).toContain('setCanvasMode("video-detail")');
    expect(source).toContain("onItemSelect={handleLibraryItemSelect}");
    expect(source).toContain('canvasMode === "video-detail"');
    expect(source).toContain("<VideoDetailPage");
    expect(source).toContain("onVideoMemorySave={handleVideoMemorySave}");
    expect(source).toContain("onVideoMemoryRemove={handleVideoMemoryRemove}");
    expect(source).toContain('className={getAppNavButtonClass(canvasMode === "library" || canvasMode === "video-detail")}');
    expect(source).not.toContain('onClick={() => handleCanvasModeChange("video-detail")}');
  });

  it("keeps edit and remove actions local without AI or viewing-duration claims", () => {
    const source = readDetailPage();
    const appShellSource = readAppShell();

    expect(source).toContain("onSave(item.id, { tag, note })");
    expect(source).toContain("onVideoMemoryRemove(item.id)");
    expect(source).toContain("getRemoveActionCopy");
    expect(source).toContain("getRemoveStatusText");
    expect(source).toContain('item.source === "manual"');
    expect(source).toContain("window.confirm");
    expect(source).toContain("저장함에서 제거");
    expect(source).toContain("저장한 영상 삭제");
    expect(appShellSource).toContain('import { removeVideoLibraryMemory } from "@/lib/library/videoLibrary";');
    expect(appShellSource).toContain("const handleVideoMemoryRemove = useCallback");
    expect(appShellSource).toContain("removeVideoLibraryMemory(savedWatchItems, itemId)");
    expect(appShellSource).toContain("indexedDbWatchHistoryRepository.save(result.items)");
    expect(appShellSource).toContain('setCanvasMode("library")');
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("axios");
    expect(source).not.toContain("AI 요약 만들기");
    expect(source).not.toContain("시청 시간");
    expect(source).not.toContain("사용 시간");
    expect(source).not.toContain("watch time");
    expect(source).not.toContain("usage time");
  });
});
