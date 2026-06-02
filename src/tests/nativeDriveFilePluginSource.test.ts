import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const nativeDriveFilePluginPath = join(
  process.cwd(),
  "android",
  "app",
  "src",
  "main",
  "java",
  "com",
  "lucita81",
  "youtubedailymindmap",
  "NativeDriveFilePlugin.java"
);

function readNativeDriveFilePlugin(): string {
  return readFileSync(nativeDriveFilePluginPath, "utf8");
}

describe("NativeDriveFilePlugin source guards", () => {
  it("keeps watch-history ZIP entry read limits in the native parser", () => {
    const source = readNativeDriveFilePlugin();

    expect(source).toContain("MAX_HISTORY_ENTRY_UNCOMPRESSED_BYTES");
    expect(source).toContain("MAX_HTML_HISTORY_ENTRY_BYTES");
    expect(source).toContain("assertHistoryEntryWithinReadLimit(entry, entryName, entryReadLimitBytes)");
    expect(source).toContain("new LimitedInputStream(inputStream, entryReadLimitBytes, entryName)");
    expect(source).toContain("private ParsedHistory parseHistoryEntry(");
  });

  it("keeps HTML history reads bounded before loading them into memory", () => {
    const source = readNativeDriveFilePlugin();

    expect(source).toContain("readEntryAsString(limitedInputStream, entryReadLimitBytes, entryName)");
    expect(source).toContain("readEntryAsString(InputStream inputStream, long maxBytes, String entryName)");
    expect(source).toContain("outputStream.size() + read > maxBytes");
    expect(source).not.toContain("readEntryAsString(inputStream)");
  });

  it("keeps a runtime byte-counting guard for entries without reliable declared sizes", () => {
    const source = readNativeDriveFilePlugin();

    expect(source).toContain("private class LimitedInputStream extends InputStream");
    expect(source).toContain("trackBytesRead");
    expect(source).toContain("bytesRead > maxBytes");
    expect(source).toContain("formatBytesForMessage(maxBytes)");
  });

  it("keeps item-count progress heartbeats while native HTML history is parsed", () => {
    const source = readNativeDriveFilePlugin();

    expect(source).toContain("HTML_PARSE_PROGRESS_ITEM_INTERVAL");
    expect(source).toContain("HTML_PARSE_PROGRESS_TIME_INTERVAL_MS");
    expect(source).toContain(
      "parseHtmlHistory(readEntryAsString(limitedInputStream, entryReadLimitBytes, entryName), fileName, totalBytes, archiveEntryCount)"
    );
    expect(source).toContain("private ParsedHistory parseHtmlHistory(String content, String fileName, long totalBytes, int archiveEntryCount)");
    expect(source).toContain("itemCount - lastEmittedItemCount >= HTML_PARSE_PROGRESS_ITEM_INTERVAL");
    expect(source).toContain("emitImportProgress(");
    expect(source).toContain("getParsePercent(index + 1, blocks.size())");
    expect(source).toContain("archiveEntryCount,");
    expect(source).toContain("itemCount");
  });

  it("separates Drive provider opening progress from actual byte copying", () => {
    const source = readNativeDriveFilePlugin();
    const openingProgressIndex = source.indexOf(
      '"Drive가 ZIP 파일을 앱에 넘길 준비를 하고 있습니다. 큰 파일은 이 단계가 오래 걸릴 수 있습니다."'
    );
    const openInputStreamIndex = source.indexOf("resolver.openInputStream(uri)");
    const copyingProgressIndex = source.indexOf('"Drive에서 ZIP을 앱 캐시로 복사하는 중입니다."');

    expect(openingProgressIndex).toBeGreaterThan(0);
    expect(openInputStreamIndex).toBeGreaterThan(0);
    expect(copyingProgressIndex).toBeGreaterThan(openInputStreamIndex);
    expect(openingProgressIndex).toBeLessThan(openInputStreamIndex);
    expect(source).toContain('"opening",\n            8,');
    expect(source).toContain('"copying",\n            getCopyPercent(0L, size),');
    expect(source).toContain("0L,\n            size,\n            0,\n            0");
  });

  it("keeps native Drive copy timing checkpoints without logging file contents or URIs", () => {
    const source = readNativeDriveFilePlugin();
    const openStartedIndex = source.indexOf("Native Drive openInputStream starting");
    const openCompletedIndex = source.indexOf("Native Drive openInputStream completed");
    const firstWaitIndex = source.indexOf("Native Drive first byte wait started");
    const firstReceivedIndex = source.indexOf("Native Drive first byte received");
    const copyCompletedIndex = source.indexOf("Native Drive copy completed");

    expect(source).toContain("import android.os.SystemClock;");
    expect(source).toContain("private long elapsedSince(long startedAtMs)");
    expect(source).toContain("private String getSafeProviderLabel(Uri uri)");
    expect(source).toContain("String providerLabel = getSafeProviderLabel(uri);");
    expect(source).toContain("private void logImportInfo(String message)");
    expect(source).toContain("private void logImportWarning(String message)");
    expect(source).toContain("private void logImportError(String message, Exception error)");
    expect(source).toContain("import android.content.pm.ApplicationInfo;");
    expect(source).toContain("private boolean isDebugBuild()");
    expect(source).toContain("ApplicationInfo.FLAG_DEBUGGABLE");
    expect(source).toContain("if (isDebugBuild())");
    expect(openStartedIndex).toBeGreaterThan(0);
    expect(openCompletedIndex).toBeGreaterThan(openStartedIndex);
    expect(firstWaitIndex).toBeGreaterThan(openCompletedIndex);
    expect(firstReceivedIndex).toBeGreaterThan(firstWaitIndex);
    expect(copyCompletedIndex).toBeGreaterThan(firstReceivedIndex);
    expect(source).toContain("firstReadElapsedMs=");
    expect(source).toContain("totalElapsedMs=");
    expect(source).toContain("firstChunkBytes=");
    expect(source).toContain("copiedBytes=");
    expect(source).toContain("totalBytes=");
    expect(source).toContain("Native Drive copy started: provider=");
    expect(source).toContain("Native Drive copy failed: provider=");
    expect(source).not.toContain("Starting native Takeout import: \" + valueOrEmpty(fileName)");
    expect(source).not.toContain("getAbsolutePath()");
    expect(source).not.toContain("Log.i(TAG, \"");
    expect(source).not.toContain("Log.w(TAG, \"");
    expect(source).not.toContain("Log.e(TAG, \"");
    expect(source).not.toContain("+ uri");
  });
});
