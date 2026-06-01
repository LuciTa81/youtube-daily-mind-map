import JSZip from "jszip";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PickedDriveFile } from "@/lib/drive/googlePicker";
import { GoogleDriveTakeoutWatchHistorySource } from "@/lib/import/watchHistorySources";

function pickedFile(overrides?: Partial<PickedDriveFile>): PickedDriveFile {
  return {
    id: "drive-file-1",
    name: "takeout.zip",
    mimeType: "application/zip",
    accessToken: "token",
    capabilities: { canTrash: true, canDelete: true },
    ...overrides
  };
}

describe("GoogleDriveTakeoutWatchHistorySource", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("downloads a selected Drive ZIP and parses watch history", async () => {
    const zip = new JSZip();
    zip.file(
      "Takeout/YouTube and YouTube Music/history/watch-history.json",
      JSON.stringify([
        {
          header: "YouTube",
          title: "Watched Next.js App Router 강의",
          titleUrl: "https://www.youtube.com/watch?v=next",
          subtitles: [{ name: "생활코딩" }],
          time: "2026-05-27T10:30:00Z"
        }
      ])
    );
    const content = await zip.generateAsync({ type: "arraybuffer" });
    const fetchMock = vi.fn(async () => new Response(content, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const source = new GoogleDriveTakeoutWatchHistorySource();
    const onStatusChange = vi.fn();
    const onDownloadProgress = vi.fn();
    const result = await source.import(pickedFile(), { onStatusChange, onDownloadProgress });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://www.googleapis.com/drive/v3/files/drive-file-1?alt=media&supportsAllDrives=true",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token"
        })
      })
    );
    expect(onStatusChange).toHaveBeenCalledWith("Drive 파일을 다운로드하는 중입니다.");
    expect(onStatusChange).toHaveBeenCalledWith("Takeout 파일 안에서 시청 기록을 찾는 중입니다.");
    expect(onStatusChange).toHaveBeenCalledWith("Drive 시청 기록 파싱이 끝났습니다.");
    expect(result.sourceName).toBe("Drive · takeout.zip");
    expect(result.source).toBe("takeout-zip");
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      title: "Next.js App Router 강의",
      channelName: "생활코딩"
    });
  });
});
