import { downloadDriveFile, type DriveDownloadProgress } from "@/lib/drive/googleDriveApi";
import type { PickedDriveFile } from "@/lib/drive/googlePicker";
import {
  parseTakeoutBrowserFile,
  parseTakeoutFile,
  parseTakeoutZip,
  type ParsedWatchHistory
} from "@/lib/import/parseTakeout";

export type WatchHistoryImportResult = ParsedWatchHistory & {
  sourceName: string;
};

export type WatchHistoryImportOptions = {
  signal?: AbortSignal;
  onStatusChange?: (message: string) => void;
  onDownloadProgress?: (progress: DriveDownloadProgress) => void;
};

export interface WatchHistorySource<TInput> {
  readonly id: string;
  readonly label: string;
  import(input: TInput, options?: WatchHistoryImportOptions): Promise<WatchHistoryImportResult>;
}

export class TakeoutFileWatchHistorySource implements WatchHistorySource<File> {
  readonly id = "takeout-file";
  readonly label = "Google Takeout 파일";

  async import(file: File, options?: WatchHistoryImportOptions): Promise<WatchHistoryImportResult> {
    options?.onStatusChange?.("기기에서 Takeout 파일을 읽는 중입니다.");
    const result = await parseTakeoutBrowserFile(file);
    options?.onStatusChange?.("시청 기록 파싱이 끝났습니다.");

    return {
      ...result,
      sourceName: file.name
    };
  }
}

function isZipLikeFile(fileName: string, mimeType?: string): boolean {
  const lowerFileName = fileName.toLocaleLowerCase("ko-KR");
  return (
    lowerFileName.endsWith(".zip") ||
    mimeType === "application/zip" ||
    mimeType === "application/x-zip" ||
    mimeType === "application/x-zip-compressed"
  );
}

export class GoogleDriveTakeoutWatchHistorySource implements WatchHistorySource<PickedDriveFile> {
  readonly id = "google-drive-takeout";
  readonly label = "Google Drive Takeout 파일";

  async import(file: PickedDriveFile, options?: WatchHistoryImportOptions): Promise<WatchHistoryImportResult> {
    options?.onStatusChange?.("Drive 파일을 다운로드하는 중입니다.");
    const content = await downloadDriveFile(file.accessToken, file.id, {
      signal: options?.signal,
      onProgress: options?.onDownloadProgress
    });
    options?.onStatusChange?.("Takeout 파일 안에서 시청 기록을 찾는 중입니다.");
    const result = isZipLikeFile(file.name, file.mimeType)
      ? await parseTakeoutZip(file.name, content)
      : parseTakeoutFile(file.name, new TextDecoder().decode(content));
    options?.onStatusChange?.("Drive 시청 기록 파싱이 끝났습니다.");

    return {
      ...result,
      sourceName: `Drive · ${file.name}`
    };
  }
}

export class DataPortabilityWatchHistorySource implements WatchHistorySource<void> {
  readonly id = "data-portability";
  readonly label = "Google 계정 연동";

  async import(): Promise<WatchHistoryImportResult> {
    throw new Error("Google 계정 연동은 OAuth 검증과 Data Portability API 설정 후 활성화됩니다.");
  }
}
