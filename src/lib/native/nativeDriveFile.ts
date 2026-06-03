import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";
import type { ParsedWatchHistory } from "@/lib/import/parseTakeout";

type NativeParsedTakeoutZipResult = ParsedWatchHistory & {
  fileName: string;
  mimeType?: string;
  size?: number;
  provider?: string;
};

type NativeDriveFilePlugin = {
  pickTakeoutZip: () => Promise<NativeParsedTakeoutZipResult>;
  cancelTakeoutImport: () => Promise<{ cancelled: boolean }>;
  addListener: (
    eventName: "nativeDriveImportProgress",
    listenerFunc: (progress: NativeDriveImportProgress) => void
  ) => Promise<PluginListenerHandle>;
};

type NativeDriveProgressHandle = {
  remove: () => Promise<void>;
};

export type NativeDriveImportProgress = {
  phase: "opening" | "copying" | "scanning" | "reading" | "parsing" | "finalizing" | "complete" | "cancelled" | "error";
  percent: number;
  message: string;
  fileName?: string;
  bytesRead?: number;
  totalBytes?: number;
  entryCount?: number;
  itemCount?: number;
};

export type NativeDriveTakeoutImportResult = ParsedWatchHistory & {
  sourceName: string;
  nativeFile: {
    fileName: string;
    mimeType?: string;
    size?: number;
    provider?: string;
  };
};

type NativeDriveImportRunnerOptions = {
  staleTimeoutMs?: number;
  onProgress?: (progress: NativeDriveImportProgress) => void;
};

type NativeDriveImportRunnerDependencies = {
  addProgressListener: (listener: (progress: NativeDriveImportProgress) => void) => Promise<NativeDriveProgressHandle>;
  importTakeoutZip: () => Promise<NativeDriveTakeoutImportResult>;
};

export const NATIVE_DRIVE_IMPORT_STALE_TIMEOUT_MS = 60_000;
export const NATIVE_DRIVE_IMPORT_LARGE_FILE_BYTES = 1_000 * 1024 * 1024;
export const NATIVE_DRIVE_IMPORT_LARGE_FILE_STALE_TIMEOUT_MS = 20 * 60_000;
export const NATIVE_DRIVE_IMPORT_CANCELLED_MESSAGE = "가져오기를 취소했습니다.";
export const NATIVE_DRIVE_IMPORT_STALE_MESSAGE =
  "Drive ZIP을 읽는 중 진행이 멈췄습니다. 네트워크 상태를 확인한 뒤 같은 파일을 다시 선택해주세요.";

const NativeDriveFile = registerPlugin<NativeDriveFilePlugin>("NativeDriveFile");

function getNativeDriveErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Drive ZIP을 읽는 중 문제가 발생했습니다.";
}

function removeProgressListenerInBackground(progressHandle: NativeDriveProgressHandle) {
  try {
    void progressHandle.remove().catch(() => undefined);
  } catch {
    // Listener cleanup must not block import completion or error propagation.
  }
}

export function getNativeDriveImportStaleTimeoutMs(
  progress: NativeDriveImportProgress,
  fallbackTimeoutMs = NATIVE_DRIVE_IMPORT_STALE_TIMEOUT_MS
): number {
  const totalBytes = progress.totalBytes ?? 0;
  const isLargeDriveFile = totalBytes >= NATIVE_DRIVE_IMPORT_LARGE_FILE_BYTES;

  if (isLargeDriveFile) {
    return Math.max(fallbackTimeoutMs, NATIVE_DRIVE_IMPORT_LARGE_FILE_STALE_TIMEOUT_MS);
  }

  return fallbackTimeoutMs;
}

export function isNativeDriveFilePickerAvailable(): boolean {
  return Capacitor.getPlatform() === "android";
}

export function addNativeDriveImportProgressListener(
  listener: (progress: NativeDriveImportProgress) => void
): Promise<PluginListenerHandle> {
  return NativeDriveFile.addListener("nativeDriveImportProgress", listener);
}

export async function importNativeDriveTakeoutZip(): Promise<NativeDriveTakeoutImportResult> {
  const pickedFile = await NativeDriveFile.pickTakeoutZip();

  return {
    items: pickedFile.items,
    skippedCount: pickedFile.skippedCount,
    source: pickedFile.source,
    parserSource: pickedFile.parserSource,
    matchedFileName: pickedFile.matchedFileName,
    archiveEntryCount: pickedFile.archiveEntryCount,
    sourceName: `Drive · ${pickedFile.fileName}`,
    nativeFile: {
      fileName: pickedFile.fileName,
      mimeType: pickedFile.mimeType,
      size: pickedFile.size,
      provider: pickedFile.provider
    }
  };
}

export function cancelNativeDriveTakeoutZipImport(): Promise<{ cancelled: boolean }> {
  return NativeDriveFile.cancelTakeoutImport();
}

export async function runNativeDriveTakeoutZipImportWithProgressTimeout(
  dependencies: NativeDriveImportRunnerDependencies,
  options?: NativeDriveImportRunnerOptions
): Promise<NativeDriveTakeoutImportResult> {
  const staleTimeoutMs = options?.staleTimeoutMs ?? NATIVE_DRIVE_IMPORT_STALE_TIMEOUT_MS;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let latestProgress: NativeDriveImportProgress | undefined;
  let rejectForStaleProgress: ((error: Error) => void) | undefined;
  let settled = false;

  function clearStaleTimer() {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  }

  function scheduleStaleTimer(progress: NativeDriveImportProgress) {
    clearStaleTimer();
    if (progress.phase === "complete" || progress.phase === "cancelled" || progress.phase === "error") {
      return;
    }

    timeoutId = setTimeout(() => {
      if (settled) {
        return;
      }

      const timeoutProgress: NativeDriveImportProgress = {
        ...(latestProgress ?? {}),
        phase: "error",
        percent: latestProgress?.percent ?? 0,
        message: NATIVE_DRIVE_IMPORT_STALE_MESSAGE
      };
      latestProgress = timeoutProgress;
      options?.onProgress?.(timeoutProgress);
      rejectForStaleProgress?.(new Error(NATIVE_DRIVE_IMPORT_STALE_MESSAGE));
    }, getNativeDriveImportStaleTimeoutMs(progress, staleTimeoutMs));
  }

  const staleProgressPromise = new Promise<never>((_, reject) => {
    rejectForStaleProgress = reject;
  });

  const progressHandle = await dependencies.addProgressListener((progress) => {
    latestProgress = progress;
    options?.onProgress?.(progress);
    scheduleStaleTimer(progress);
  });

  const importPromise = dependencies.importTakeoutZip();
  importPromise.catch(() => undefined);

  try {
    return await Promise.race([importPromise, staleProgressPromise]);
  } catch (error) {
    if (latestProgress?.phase !== "error") {
      const errorProgress: NativeDriveImportProgress = {
        ...(latestProgress ?? {}),
        phase: "error",
        percent: latestProgress?.percent ?? 0,
        message: getNativeDriveErrorMessage(error)
      };
      latestProgress = errorProgress;
      options?.onProgress?.(errorProgress);
    }

    throw error;
  } finally {
    settled = true;
    clearStaleTimer();
    removeProgressListenerInBackground(progressHandle);
  }
}

export function importNativeDriveTakeoutZipWithProgressTimeout(
  options?: NativeDriveImportRunnerOptions
): Promise<NativeDriveTakeoutImportResult> {
  return runNativeDriveTakeoutZipImportWithProgressTimeout(
    {
      addProgressListener: addNativeDriveImportProgressListener,
      importTakeoutZip: importNativeDriveTakeoutZip
    },
    options
  );
}
