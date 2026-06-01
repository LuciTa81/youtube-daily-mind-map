import { Capacitor, registerPlugin } from "@capacitor/core";
import { parseTakeoutZip, type ParsedWatchHistory } from "@/lib/import/parseTakeout";

type PickTakeoutZipResult = {
  fileName: string;
  mimeType?: string;
  size?: number;
  provider?: string;
  base64: string;
};

type NativeDriveFilePlugin = {
  pickTakeoutZip: () => Promise<PickTakeoutZipResult>;
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

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}

export async function importNativeDriveTakeoutZip(): Promise<NativeDriveTakeoutImportResult> {
  const pickedFile = await NativeDriveFile.pickTakeoutZip();
  const parsed = await parseTakeoutZip(pickedFile.fileName, base64ToArrayBuffer(pickedFile.base64));

  return {
    ...parsed,
    sourceName: `Drive · ${pickedFile.fileName}`,
    nativeFile: {
      fileName: pickedFile.fileName,
      mimeType: pickedFile.mimeType,
      size: pickedFile.size,
      provider: pickedFile.provider
    }
  };
}
