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
  addListener: (
    eventName: "nativeDriveImportProgress",
    listenerFunc: (progress: NativeDriveImportProgress) => void
  ) => Promise<PluginListenerHandle>;
};

export type NativeDriveImportProgress = {
  phase: "opening" | "scanning" | "reading" | "parsing" | "complete";
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

const NativeDriveFile = registerPlugin<NativeDriveFilePlugin>("NativeDriveFile");

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
