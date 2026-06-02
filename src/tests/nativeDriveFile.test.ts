import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getNativeDriveImportStaleTimeoutMs,
  NATIVE_DRIVE_IMPORT_LARGE_FILE_STALE_TIMEOUT_MS,
  NATIVE_DRIVE_IMPORT_STALE_MESSAGE,
  runNativeDriveTakeoutZipImportWithProgressTimeout,
  type NativeDriveImportProgress,
  type NativeDriveTakeoutImportResult
} from "@/lib/native/nativeDriveFile";

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    getPlatform: () => "android"
  },
  registerPlugin: () => ({
    pickTakeoutZip: vi.fn(),
    addListener: vi.fn()
  })
}));

function normalNativeResult(): NativeDriveTakeoutImportResult {
  return {
    items: [
      {
        id: "native-drive-1",
        title: "Next.js App Router review",
        url: "https://www.youtube.com/watch?v=native1",
        channelName: "Frontend Lab",
        watchedAt: "2026-05-27T10:30:00.000Z",
        source: "takeout-json"
      }
    ],
    skippedCount: 0,
    source: "takeout-zip",
    parserSource: "takeout-json",
    matchedFileName: "Takeout/YouTube and YouTube Music/history/watch-history.json",
    archiveEntryCount: 1,
    sourceName: "Drive · takeout.zip",
    nativeFile: {
      fileName: "takeout.zip",
      mimeType: "application/zip",
      size: 56_832,
      provider: "com.google.android.apps.docs.storage"
    }
  };
}

describe("native Drive Takeout import watchdog", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("allows large Drive file phases to run past the normal stale timeout", () => {
    const largeDriveOpeningProgress: NativeDriveImportProgress = {
      phase: "opening",
      percent: 8,
      message: "Drive ZIP을 준비하는 중입니다.",
      fileName: "takeout-20260601T101749Z-3-001.zip",
      totalBytes: 1_784_501_720
    };
    const largeDriveCopyingProgress: NativeDriveImportProgress = {
      ...largeDriveOpeningProgress,
      phase: "copying",
      percent: 12,
      bytesRead: 215_000_000
    };
    const largeDriveParsingProgress: NativeDriveImportProgress = {
      ...largeDriveOpeningProgress,
      phase: "parsing",
      percent: 82
    };
    const smallParsingProgress: NativeDriveImportProgress = {
      ...largeDriveParsingProgress,
      fileName: "takeout.zip",
      totalBytes: 56_832
    };

    expect(getNativeDriveImportStaleTimeoutMs(largeDriveOpeningProgress, 1_000)).toBe(
      NATIVE_DRIVE_IMPORT_LARGE_FILE_STALE_TIMEOUT_MS
    );
    expect(getNativeDriveImportStaleTimeoutMs(largeDriveCopyingProgress, 1_000)).toBe(
      NATIVE_DRIVE_IMPORT_LARGE_FILE_STALE_TIMEOUT_MS
    );
    expect(getNativeDriveImportStaleTimeoutMs(largeDriveParsingProgress, 1_000)).toBe(
      NATIVE_DRIVE_IMPORT_LARGE_FILE_STALE_TIMEOUT_MS
    );
    expect(getNativeDriveImportStaleTimeoutMs(smallParsingProgress, 1_000)).toBe(1_000);
  });

  it("does not mark a large Drive opening phase stale at the normal timeout", async () => {
    vi.useFakeTimers();
    const remove = vi.fn(async () => undefined);
    let listener: ((progress: NativeDriveImportProgress) => void) | undefined;
    const onProgress = vi.fn();

    const stalledLargeImport = runNativeDriveTakeoutZipImportWithProgressTimeout(
      {
        addProgressListener: async (progressListener) => {
          listener = progressListener;
          return { remove };
        },
        importTakeoutZip: () => {
          listener?.({
            phase: "opening",
            percent: 8,
            message: "Drive ZIP을 준비하는 중입니다.",
            fileName: "takeout-20260601T101749Z-3-001.zip",
            totalBytes: 1_784_501_720
          });
          return new Promise<NativeDriveTakeoutImportResult>(() => undefined);
        }
      },
      { onProgress, staleTimeoutMs: 1_000 }
    );

    const rejection = expect(stalledLargeImport).rejects.toThrow(NATIVE_DRIVE_IMPORT_STALE_MESSAGE);
    await vi.advanceTimersByTimeAsync(1_000);

    expect(onProgress).not.toHaveBeenCalledWith(expect.objectContaining({ phase: "error" }));

    await vi.advanceTimersByTimeAsync(NATIVE_DRIVE_IMPORT_LARGE_FILE_STALE_TIMEOUT_MS - 1_000);

    await rejection;
    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ phase: "error", percent: 8 }));
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("does not mark a large Drive parsing phase stale at the normal timeout", async () => {
    vi.useFakeTimers();
    const remove = vi.fn(async () => undefined);
    let listener: ((progress: NativeDriveImportProgress) => void) | undefined;
    const onProgress = vi.fn();

    const stalledLargeImport = runNativeDriveTakeoutZipImportWithProgressTimeout(
      {
        addProgressListener: async (progressListener) => {
          listener = progressListener;
          return { remove };
        },
        importTakeoutZip: () => {
          listener?.({
            phase: "parsing",
            percent: 82,
            message: "시청 기록 파일을 찾았습니다. 기록을 읽는 중입니다.",
            fileName: "takeout-20260601T101749Z-3-001.zip",
            totalBytes: 1_784_501_720,
            entryCount: 30
          });
          return new Promise<NativeDriveTakeoutImportResult>(() => undefined);
        }
      },
      { onProgress, staleTimeoutMs: 1_000 }
    );

    const rejection = expect(stalledLargeImport).rejects.toThrow(NATIVE_DRIVE_IMPORT_STALE_MESSAGE);
    await vi.advanceTimersByTimeAsync(1_000);

    expect(onProgress).not.toHaveBeenCalledWith(expect.objectContaining({ phase: "error" }));

    await vi.advanceTimersByTimeAsync(NATIVE_DRIVE_IMPORT_LARGE_FILE_STALE_TIMEOUT_MS - 1_000);

    await rejection;
    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ phase: "error", percent: 82 }));
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("keeps the small normal Drive ZIP completion path open", async () => {
    const remove = vi.fn(async () => undefined);
    let listener: ((progress: NativeDriveImportProgress) => void) | undefined;
    const onProgress = vi.fn();
    const result = normalNativeResult();

    const completed = await runNativeDriveTakeoutZipImportWithProgressTimeout(
      {
        addProgressListener: async (progressListener) => {
          listener = progressListener;
          return { remove };
        },
        importTakeoutZip: async () => {
          listener?.({
            phase: "parsing",
            percent: 82,
            message: "시청 기록 파일을 찾았습니다. 기록을 읽는 중입니다.",
            fileName: "takeout.zip",
            totalBytes: 56_832,
            entryCount: 1
          });
          listener?.({
            phase: "complete",
            percent: 100,
            message: "1개 시청 기록을 찾았습니다.",
            fileName: "takeout.zip",
            totalBytes: 56_832,
            entryCount: 1,
            itemCount: 1
          });
          return result;
        }
      },
      { onProgress, staleTimeoutMs: 1_000 }
    );

    expect(completed).toBe(result);
    expect(completed.items).toHaveLength(1);
    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ phase: "parsing", percent: 82 }));
    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ phase: "complete", percent: 100 }));
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("turns a stalled records-reading phase into an error state", async () => {
    vi.useFakeTimers();
    const remove = vi.fn(async () => undefined);
    let listener: ((progress: NativeDriveImportProgress) => void) | undefined;
    const onProgress = vi.fn();

    const stalledImport = runNativeDriveTakeoutZipImportWithProgressTimeout(
      {
        addProgressListener: async (progressListener) => {
          listener = progressListener;
          return { remove };
        },
        importTakeoutZip: () => {
          listener?.({
            phase: "parsing",
            percent: 82,
            message: "시청 기록 파일을 찾았습니다. 기록을 읽는 중입니다.",
            fileName: "takeout.zip",
            totalBytes: 56_832,
            entryCount: 1
          });
          return new Promise<NativeDriveTakeoutImportResult>(() => undefined);
        }
      },
      { onProgress, staleTimeoutMs: 1_000 }
    );

    const rejection = expect(stalledImport).rejects.toThrow(NATIVE_DRIVE_IMPORT_STALE_MESSAGE);
    await vi.advanceTimersByTimeAsync(1_000);

    await rejection;
    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ phase: "error", percent: 82 }));
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("propagates native rejection even when listener cleanup is stalled", async () => {
    const remove = vi.fn(() => new Promise<void>(() => undefined));
    let listener: ((progress: NativeDriveImportProgress) => void) | undefined;
    const onProgress = vi.fn();
    const nativeErrorMessage =
      "Takeout ZIP 안에서 YouTube 시청 기록을 찾지 못했습니다. Takeout에서 YouTube 및 YouTube Music의 기록을 포함했는지 확인해주세요.";

    const failedImport = runNativeDriveTakeoutZipImportWithProgressTimeout(
      {
        addProgressListener: async (progressListener) => {
          listener = progressListener;
          return { remove };
        },
        importTakeoutZip: async () => {
          listener?.({
            phase: "parsing",
            percent: 82,
            message: "시청 기록 파일을 찾았습니다. 기록을 읽는 중입니다.",
            fileName: "takeout.zip",
            totalBytes: 56_832,
            entryCount: 1
          });

          throw new Error(nativeErrorMessage);
        }
      },
      { onProgress, staleTimeoutMs: 60_000 }
    );

    await expect(failedImport).rejects.toThrow(nativeErrorMessage);
    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ phase: "parsing", percent: 82 }));
    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: "error",
        percent: 82,
        message: nativeErrorMessage
      })
    );
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
