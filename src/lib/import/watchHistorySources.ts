import { parseTakeoutBrowserFile, type ParsedWatchHistory } from "@/lib/import/parseTakeout";

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

export class DataPortabilityWatchHistorySource implements WatchHistorySource<void> {
  readonly id = "data-portability";
  readonly label = "Google 계정 연동";

  async import(): Promise<WatchHistoryImportResult> {
    throw new Error("Google 계정 연동은 OAuth 검증과 Data Portability API 설정 후 활성화됩니다.");
  }
}
