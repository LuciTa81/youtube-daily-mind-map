import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

type SmokeResult = {
  fileName: string;
  entryCount: number;
  fileEntryCount: number;
  readBytes: number;
  historyCandidateCount: number;
  historyCandidates: Array<{
    label: string;
    type: string;
    compressedSize: number;
    uncompressedSize: number;
  }>;
  pathTraversalEntryCount: number;
  privacy: {
    readEntryContents: boolean;
    includesEntryContents: boolean;
    includesWatchTitles: boolean;
    includesWatchUrls: boolean;
  };
};

async function writeZipFixture(zip: JSZip, fileName: string): Promise<{ directory: string; filePath: string }> {
  const directory = await mkdtemp(path.join(tmpdir(), "takeout-smoke-"));
  const filePath = path.join(directory, fileName);
  const content = await zip.generateAsync({ type: "uint8array" });

  await writeFile(filePath, content);

  return { directory, filePath };
}

async function writeRawZipFixture(content: Uint8Array, fileName: string): Promise<{ directory: string; filePath: string }> {
  const directory = await mkdtemp(path.join(tmpdir(), "takeout-smoke-"));
  const filePath = path.join(directory, fileName);

  await writeFile(filePath, content);

  return { directory, filePath };
}

function buildStoredZipWithSingleEmptyEntry(entryNameBytes: Buffer): Uint8Array {
  const localHeader = Buffer.alloc(30);
  localHeader.writeUInt32LE(0x04034b50, 0);
  localHeader.writeUInt16LE(20, 4);
  localHeader.writeUInt16LE(0, 6);
  localHeader.writeUInt16LE(0, 8);
  localHeader.writeUInt16LE(0, 10);
  localHeader.writeUInt16LE(0, 12);
  localHeader.writeUInt32LE(0, 14);
  localHeader.writeUInt32LE(0, 18);
  localHeader.writeUInt32LE(0, 22);
  localHeader.writeUInt16LE(entryNameBytes.length, 26);
  localHeader.writeUInt16LE(0, 28);

  const localRecord = Buffer.concat([localHeader, entryNameBytes]);
  const centralDirectory = Buffer.alloc(46);
  centralDirectory.writeUInt32LE(0x02014b50, 0);
  centralDirectory.writeUInt16LE(20, 4);
  centralDirectory.writeUInt16LE(20, 6);
  centralDirectory.writeUInt16LE(0, 8);
  centralDirectory.writeUInt16LE(0, 10);
  centralDirectory.writeUInt16LE(0, 12);
  centralDirectory.writeUInt16LE(0, 14);
  centralDirectory.writeUInt32LE(0, 16);
  centralDirectory.writeUInt32LE(0, 20);
  centralDirectory.writeUInt32LE(0, 24);
  centralDirectory.writeUInt16LE(entryNameBytes.length, 28);
  centralDirectory.writeUInt16LE(0, 30);
  centralDirectory.writeUInt16LE(0, 32);
  centralDirectory.writeUInt16LE(0, 34);
  centralDirectory.writeUInt16LE(0, 36);
  centralDirectory.writeUInt32LE(0, 38);
  centralDirectory.writeUInt32LE(0, 42);

  const centralRecord = Buffer.concat([centralDirectory, entryNameBytes]);
  const endOfCentralDirectory = Buffer.alloc(22);
  endOfCentralDirectory.writeUInt32LE(0x06054b50, 0);
  endOfCentralDirectory.writeUInt16LE(0, 4);
  endOfCentralDirectory.writeUInt16LE(0, 6);
  endOfCentralDirectory.writeUInt16LE(1, 8);
  endOfCentralDirectory.writeUInt16LE(1, 10);
  endOfCentralDirectory.writeUInt32LE(centralRecord.length, 12);
  endOfCentralDirectory.writeUInt32LE(localRecord.length, 16);
  endOfCentralDirectory.writeUInt16LE(0, 20);

  return Buffer.concat([localRecord, centralRecord, endOfCentralDirectory]);
}

async function runSmokeScript(filePath: string): Promise<{ stdout: string; result: SmokeResult }> {
  const { stdout } = await execFileAsync(
    process.execPath,
    ["scripts/smoke-large-takeout.mjs", filePath, "--json"],
    { cwd: process.cwd() }
  );

  return { stdout, result: JSON.parse(stdout) as SmokeResult };
}

describe("large Takeout smoke script", () => {
  it("scans ZIP structure without printing watch-history contents", async () => {
    const zip = new JSZip();
    zip.file("Takeout/archive_browser.html", "<html><body>Takeout index</body></html>");
    zip.file(
      "Takeout/YouTube and YouTube Music/history/watch-history.json",
      JSON.stringify([
        {
          title: "PRIVATE_TITLE_SHOULD_NOT_APPEAR",
          titleUrl: "https://www.youtube.com/watch?v=private",
          time: "2026-05-27T00:00:00Z"
        }
      ])
    );

    const { directory, filePath } = await writeZipFixture(zip, "takeout-private-fixture.zip");

    try {
      const { stdout, result } = await runSmokeScript(filePath);

      expect(result.fileName).toBe("takeout-private-fixture.zip");
      expect(result.entryCount).toBeGreaterThanOrEqual(2);
      expect(result.fileEntryCount).toBe(2);
      expect(result.historyCandidateCount).toBe(1);
      expect(result.historyCandidates[0]).toMatchObject({
        label: "YouTube and YouTube Music/history/watch-history.json",
        type: "json"
      });
      expect(result.privacy).toEqual({
        readEntryContents: false,
        includesEntryContents: false,
        includesWatchTitles: false,
        includesWatchUrls: false
      });
      expect(stdout).not.toContain("PRIVATE_TITLE_SHOULD_NOT_APPEAR");
      expect(stdout).not.toContain("https://www.youtube.com/watch");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("flags suspicious ZIP entry paths during structure scans", async () => {
    const zip = new JSZip();
    zip.file("../outside.txt", "do not extract this");
    zip.file("Takeout/YouTube and YouTube Music/history/watch-history.html", "<html></html>");

    const { directory, filePath } = await writeZipFixture(zip, "takeout-path-fixture.zip");

    try {
      const { result } = await runSmokeScript(filePath);

      expect(result.historyCandidateCount).toBe(1);
      expect(result.pathTraversalEntryCount).toBeGreaterThan(0);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("detects Korean localized watch-history entry names without reading contents", async () => {
    const cp949EntryName = Buffer.concat([
      Buffer.from("Takeout/YouTube/", "ascii"),
      Buffer.from([0xbd, 0xc3, 0xc3, 0xbb, 0x20, 0xb1, 0xe2, 0xb7, 0xcf]),
      Buffer.from(".html", "ascii")
    ]);
    const { directory, filePath } = await writeRawZipFixture(
      buildStoredZipWithSingleEmptyEntry(cp949EntryName),
      "takeout-cp949-korean-history.zip"
    );

    try {
      const { stdout, result } = await runSmokeScript(filePath);

      expect(result.historyCandidateCount).toBe(1);
      expect(result.historyCandidates[0]).toMatchObject({
        label: "Takeout/YouTube/시청 기록.html",
        type: "html",
        compressedSize: 0,
        uncompressedSize: 0
      });
      expect(result.privacy).toEqual({
        readEntryContents: false,
        includesEntryContents: false,
        includesWatchTitles: false,
        includesWatchUrls: false
      });
      expect(stdout).not.toContain("youtube.com/watch");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
