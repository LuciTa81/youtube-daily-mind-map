import { afterEach, describe, expect, it, vi } from "vitest";
import {
  downloadDriveFile,
  DriveApiError,
  formatDriveFileSize,
  getDriveApiUserMessage,
  trashDriveFile
} from "@/lib/drive/googleDriveApi";

describe("googleDriveApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("downloads a Drive file and reports byte progress", async () => {
    const content = new TextEncoder().encode("watch history");
    const fetchMock = vi.fn(async () => new Response(content, {
      status: 200,
      headers: { "content-length": String(content.byteLength) }
    }));
    vi.stubGlobal("fetch", fetchMock);

    const onProgress = vi.fn();
    const buffer = await downloadDriveFile("token", "drive-file-1", { onProgress });

    expect(new TextDecoder().decode(buffer)).toBe("watch history");
    expect(onProgress).toHaveBeenCalledWith({
      downloadedBytes: content.byteLength,
      totalBytes: content.byteLength
    });
  });

  it("normalizes Drive API permission errors", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      error: {
        code: 403,
        message: "The user does not have sufficient permissions for file.",
        status: "PERMISSION_DENIED",
        errors: [{ reason: "insufficientFilePermissions" }]
      }
    }), { status: 403 }));
    vi.stubGlobal("fetch", fetchMock);

    try {
      await downloadDriveFile("token", "drive-file-1");
      throw new Error("downloadDriveFile should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(DriveApiError);
      expect(error).toMatchObject({
        status: 403,
        code: "PERMISSION_DENIED",
        reason: "insufficientFilePermissions"
      });
      expect(getDriveApiUserMessage(error)).toContain("접근할 권한");
    }
  });

  it("moves a selected Drive file to trash", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      id: "drive-file-1",
      name: "takeout.zip",
      trashed: true,
      capabilities: { canTrash: true, canDelete: true }
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await trashDriveFile("token", "drive-file-1");
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];

    expect(result.trashed).toBe(true);
    expect(init.method).toBe("PATCH");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer token",
      "Content-Type": "application/json"
    });
    expect(JSON.parse(String(init.body))).toEqual({ trashed: true });
  });

  it("formats Drive file sizes for the import panel", () => {
    expect(formatDriveFileSize("1024")).toBe("1.0 KB");
    expect(formatDriveFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
    expect(formatDriveFileSize()).toBe("크기 정보 없음");
  });
});
