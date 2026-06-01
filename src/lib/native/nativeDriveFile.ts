import { Capacitor, registerPlugin } from "@capacitor/core";
import type { ParsedWatchHistory } from "@/lib/import/parseTakeout";

type NativeParsedTakeoutZipResult = ParsedWatchHistory & {
  fileName: string;
  mimeType?: string;
  size?: number;
  provider?: string;
};

type NativeDriveFilePlugin = {
  pickTakeoutZip: () => Promise<NativeParsedTakeoutZipResult>;
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

const NativeDriveFile = registerPlugin<NativeDriveFilePlugin>("NativeDriveFile");

export function isNativeDriveFilePickerAvailable(): boolean {
  return Capacitor.getPlatform() === "android";
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
