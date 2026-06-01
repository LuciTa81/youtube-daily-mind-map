import { downloadDriveFile } from "@/lib/drive/googleDriveApi";
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

export interface WatchHistorySource<TInput> {
  readonly id: string;
  readonly label: string;
  import(input: TInput): Promise<WatchHistoryImportResult>;
}

export class TakeoutFileWatchHistorySource implements WatchHistorySource<File> {
  readonly id = "takeout-file";
  readonly label = "Google Takeout 파일";

  async import(file: File): Promise<WatchHistoryImportResult> {
    const result = await parseTakeoutBrowserFile(file);

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

  async import(file: PickedDriveFile): Promise<WatchHistoryImportResult> {
    const content = await downloadDriveFile(file.accessToken, file.id);
    const result = isZipLikeFile(file.name, file.mimeType)
      ? await parseTakeoutZip(file.name, content)
      : parseTakeoutFile(file.name, new TextDecoder().decode(content));

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
