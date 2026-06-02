#!/usr/bin/env node

import { open } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";

const EOCD_SIGNATURE = 0x06054b50;
const ZIP64_EOCD_LOCATOR_SIGNATURE = 0x07064b50;
const ZIP64_EOCD_RECORD_SIGNATURE = 0x06064b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const EOCD_MIN_SIZE = 22;
const ZIP64_LOCATOR_SIZE = 20;
const MAX_ZIP_COMMENT_SIZE = 0xffff;
const MAX_TAIL_READ_SIZE = EOCD_MIN_SIZE + MAX_ZIP_COMMENT_SIZE;
const UINT16_MAX = 0xffff;
const UINT32_MAX = 0xffffffff;
const DEFAULT_MAX_CENTRAL_DIRECTORY_SIZE = 128 * 1024 * 1024;
const DEFAULT_OVERSIZED_ENTRY_THRESHOLD = 2 * 1024 * 1024 * 1024;
const LEGACY_KOREAN_ZIP_DECODER = new TextDecoder("euc-kr", { fatal: false });

function parseArgs(argv) {
  const args = {
    filePath: "",
    json: false,
    maxCentralDirectoryBytes: DEFAULT_MAX_CENTRAL_DIRECTORY_SIZE,
    oversizedEntryThresholdBytes: DEFAULT_OVERSIZED_ENTRY_THRESHOLD
  };

  for (const arg of argv) {
    if (arg === "--json") {
      args.json = true;
    } else if (arg.startsWith("--max-central-directory-mib=")) {
      args.maxCentralDirectoryBytes = Number(arg.split("=")[1]) * 1024 * 1024;
    } else if (arg.startsWith("--oversized-entry-mib=")) {
      args.oversizedEntryThresholdBytes = Number(arg.split("=")[1]) * 1024 * 1024;
    } else if (!args.filePath) {
      args.filePath = arg;
    }
  }

  return args;
}

function findEndOfCentralDirectory(buffer) {
  for (let index = buffer.length - EOCD_MIN_SIZE; index >= 0; index -= 1) {
    if (buffer.readUInt32LE(index) === EOCD_SIGNATURE) {
      return index;
    }
  }

  return -1;
}

function toSafeNumber(value, label) {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`${label} is too large to represent safely.`);
  }

  return Number(value);
}

function readZip64Value(extra, cursor) {
  if (cursor + 8 > extra.length) {
    return undefined;
  }

  return {
    value: toSafeNumber(extra.readBigUInt64LE(cursor), "ZIP64 extra field"),
    cursor: cursor + 8
  };
}

function readZip64ExtraField(extra, entry) {
  let offset = 0;

  while (offset + 4 <= extra.length) {
    const headerId = extra.readUInt16LE(offset);
    const dataSize = extra.readUInt16LE(offset + 2);
    const dataStart = offset + 4;
    const dataEnd = dataStart + dataSize;

    if (dataEnd > extra.length) {
      break;
    }

    if (headerId === 0x0001) {
      const data = extra.subarray(dataStart, dataEnd);
      let cursor = 0;

      if (entry.uncompressedSize === UINT32_MAX) {
        const next = readZip64Value(data, cursor);
        if (next) {
          entry.uncompressedSize = next.value;
          cursor = next.cursor;
        }
      }

      if (entry.compressedSize === UINT32_MAX) {
        const next = readZip64Value(data, cursor);
        if (next) {
          entry.compressedSize = next.value;
          cursor = next.cursor;
        }
      }

      if (entry.localHeaderOffset === UINT32_MAX) {
        const next = readZip64Value(data, cursor);
        if (next) {
          entry.localHeaderOffset = next.value;
        }
      }
    }

    offset = dataEnd;
  }
}

function normalizeZipPath(fileName) {
  return fileName.replace(/\\/g, "/");
}

function scoreHistoryFileName(fileName) {
  const lower = normalizeZipPath(fileName).toLocaleLowerCase("ko-KR");
  let score = 0;

  if (lower.includes("watch-history")) {
    score += 80;
  }
  if (lower.includes("시청 기록") || lower.includes("시청기록")) {
    score += 80;
  }
  if (lower.includes("youtube")) {
    score += 30;
  }
  if (lower.includes("history") || lower.includes("기록")) {
    score += 20;
  }

  return score;
}

function decodeZipFileName(nameBuffer, generalPurposeFlag) {
  if ((generalPurposeFlag & 0x0800) !== 0) {
    return nameBuffer.toString("utf8");
  }

  const latin1 = nameBuffer.toString("latin1");
  const korean = LEGACY_KOREAN_ZIP_DECODER.decode(nameBuffer);

  return scoreHistoryFileName(korean) > scoreHistoryFileName(latin1) ? korean : latin1;
}

function isPathTraversalSuspect(fileName) {
  const normalized = normalizeZipPath(fileName);
  return (
    normalized.startsWith("/") ||
    /^[A-Za-z]:\//.test(normalized) ||
    normalized === ".." ||
    normalized.startsWith("../") ||
    normalized.includes("/../") ||
    normalized.endsWith("/..") ||
    fileName.includes("\\")
  );
}

function isTextHistoryFile(fileName) {
  const lower = fileName.toLocaleLowerCase("ko-KR");
  return lower.endsWith(".json") || lower.endsWith(".html") || lower.endsWith(".htm");
}

function isWatchHistoryCandidate(fileName) {
  const lower = normalizeZipPath(fileName).toLocaleLowerCase("ko-KR");
  return (
    isTextHistoryFile(lower) &&
    (lower.includes("watch-history") ||
      lower.includes("시청 기록") ||
      lower.includes("시청기록") ||
      (lower.includes("youtube") && lower.includes("시청") && lower.includes("기록")))
  );
}

function getCandidateType(fileName) {
  const lower = fileName.toLocaleLowerCase("ko-KR");
  if (lower.endsWith(".json")) {
    return "json";
  }
  if (lower.endsWith(".html") || lower.endsWith(".htm")) {
    return "html";
  }

  return "other";
}

function getSafeCandidateLabel(fileName) {
  const normalized = normalizeZipPath(fileName);
  const parts = normalized.split("/").filter(Boolean);
  const historyIndex = parts.findIndex((part) => {
    const lowerPart = part.toLocaleLowerCase("ko-KR");
    return (
      lowerPart.includes("watch-history") ||
      lowerPart.includes("시청 기록") ||
      lowerPart.includes("시청기록") ||
      (lowerPart.includes("시청") && lowerPart.includes("기록"))
    );
  });
  const safeParts = historyIndex >= 0 ? parts.slice(Math.max(0, historyIndex - 2), historyIndex + 1) : parts.slice(-1);

  return safeParts.join("/");
}

function formatBytes(value) {
  const units = ["B", "KiB", "MiB", "GiB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

async function readBuffer(handle, length, position) {
  const buffer = Buffer.alloc(length);
  const { bytesRead } = await handle.read(buffer, 0, length, position);

  return buffer.subarray(0, bytesRead);
}

async function readCentralDirectoryMetadata(handle, fileSize, tailBuffer, eocdIndex, tailStartOffset) {
  const eocdAbsoluteOffset = tailStartOffset + eocdIndex;
  const eocd = tailBuffer.subarray(eocdIndex);
  const standardEntryCount = eocd.readUInt16LE(10);
  const standardCentralDirectorySize = eocd.readUInt32LE(12);
  const standardCentralDirectoryOffset = eocd.readUInt32LE(16);
  const needsZip64 =
    standardEntryCount === UINT16_MAX ||
    standardCentralDirectorySize === UINT32_MAX ||
    standardCentralDirectoryOffset === UINT32_MAX;

  if (!needsZip64) {
    return {
      entryCount: standardEntryCount,
      centralDirectorySize: standardCentralDirectorySize,
      centralDirectoryOffset: standardCentralDirectoryOffset,
      zip64: false,
      extraReadBytes: 0
    };
  }

  const locatorOffset = eocdAbsoluteOffset - ZIP64_LOCATOR_SIZE;
  if (locatorOffset < 0) {
    throw new Error("ZIP64 locator was expected but not found.");
  }

  const locator = await readBuffer(handle, ZIP64_LOCATOR_SIZE, locatorOffset);
  if (locator.length !== ZIP64_LOCATOR_SIZE || locator.readUInt32LE(0) !== ZIP64_EOCD_LOCATOR_SIGNATURE) {
    throw new Error("ZIP64 locator signature was expected but not found.");
  }

  const zip64RecordOffset = toSafeNumber(locator.readBigUInt64LE(8), "ZIP64 end of central directory offset");
  const zip64Record = await readBuffer(handle, 56, zip64RecordOffset);
  if (zip64Record.length < 56 || zip64Record.readUInt32LE(0) !== ZIP64_EOCD_RECORD_SIGNATURE) {
    throw new Error("ZIP64 end of central directory record was expected but not found.");
  }

  return {
    entryCount: toSafeNumber(zip64Record.readBigUInt64LE(32), "ZIP64 entry count"),
    centralDirectorySize: toSafeNumber(zip64Record.readBigUInt64LE(40), "ZIP64 central directory size"),
    centralDirectoryOffset: toSafeNumber(zip64Record.readBigUInt64LE(48), "ZIP64 central directory offset"),
    zip64: true,
    extraReadBytes: ZIP64_LOCATOR_SIZE + zip64Record.length
  };
}

function parseCentralDirectory(buffer, options) {
  let offset = 0;
  let entryCount = 0;
  let fileEntryCount = 0;
  let pathTraversalEntryCount = 0;
  let oversizedEntryCount = 0;
  let largestEntryCompressedSize = 0;
  let largestEntryUncompressedSize = 0;
  let archiveBrowserEntryCount = 0;
  const historyCandidates = [];

  while (offset + 46 <= buffer.length) {
    if (buffer.readUInt32LE(offset) !== CENTRAL_DIRECTORY_SIGNATURE) {
      throw new Error(`Central directory entry signature mismatch at byte ${offset}.`);
    }

    const generalPurposeFlag = buffer.readUInt16LE(offset + 8);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraFieldLength = buffer.readUInt16LE(offset + 30);
    const fileCommentLength = buffer.readUInt16LE(offset + 32);
    const fileNameStart = offset + 46;
    const fileNameEnd = fileNameStart + fileNameLength;
    const extraStart = fileNameEnd;
    const extraEnd = extraStart + extraFieldLength;
    const nextOffset = extraEnd + fileCommentLength;

    if (nextOffset > buffer.length) {
      throw new Error(`Central directory entry extends beyond the scanned buffer at byte ${offset}.`);
    }

    const nameBuffer = buffer.subarray(fileNameStart, fileNameEnd);
    const fileName = decodeZipFileName(nameBuffer, generalPurposeFlag);
    const isDirectory = normalizeZipPath(fileName).endsWith("/");
    const entry = {
      compressedSize: buffer.readUInt32LE(offset + 20),
      uncompressedSize: buffer.readUInt32LE(offset + 24),
      localHeaderOffset: buffer.readUInt32LE(offset + 42)
    };

    readZip64ExtraField(buffer.subarray(extraStart, extraEnd), entry);

    if (!isDirectory) {
      fileEntryCount += 1;
    }

    if (!isDirectory && isPathTraversalSuspect(fileName)) {
      pathTraversalEntryCount += 1;
    }

    if (!isDirectory && entry.uncompressedSize > options.oversizedEntryThresholdBytes) {
      oversizedEntryCount += 1;
    }

    if (!isDirectory) {
      largestEntryCompressedSize = Math.max(largestEntryCompressedSize, entry.compressedSize);
      largestEntryUncompressedSize = Math.max(largestEntryUncompressedSize, entry.uncompressedSize);
    }

    if (!isDirectory && normalizeZipPath(fileName).toLocaleLowerCase("ko-KR").endsWith("archive_browser.html")) {
      archiveBrowserEntryCount += 1;
    }

    if (!isDirectory && isWatchHistoryCandidate(fileName)) {
      historyCandidates.push({
        label: getSafeCandidateLabel(fileName),
        type: getCandidateType(fileName),
        compressedSize: entry.compressedSize,
        uncompressedSize: entry.uncompressedSize
      });
    }

    entryCount += 1;
    offset = nextOffset;
  }

  return {
    entryCount,
    fileEntryCount,
    historyCandidates,
    archiveBrowserEntryCount,
    pathTraversalEntryCount,
    oversizedEntryCount,
    largestEntryCompressedSize,
    largestEntryUncompressedSize
  };
}

async function scanZipStructure(filePath, options) {
  const resolvedPath = path.resolve(filePath);
  const startMemory = process.memoryUsage();
  const startedAt = performance.now();
  let readBytes = 0;

  const handle = await open(resolvedPath, "r");
  try {
    const stat = await handle.stat();
    if (stat.size < EOCD_MIN_SIZE) {
      throw new Error("File is too small to be a ZIP archive.");
    }

    const tailReadSize = Math.min(stat.size, MAX_TAIL_READ_SIZE);
    const tailStartOffset = stat.size - tailReadSize;
    const tailBuffer = await readBuffer(handle, tailReadSize, tailStartOffset);
    readBytes += tailBuffer.length;

    const eocdIndex = findEndOfCentralDirectory(tailBuffer);
    if (eocdIndex < 0) {
      throw new Error("ZIP end of central directory was not found.");
    }

    const centralDirectoryMetadata = await readCentralDirectoryMetadata(
      handle,
      stat.size,
      tailBuffer,
      eocdIndex,
      tailStartOffset
    );
    readBytes += centralDirectoryMetadata.extraReadBytes;

    if (centralDirectoryMetadata.centralDirectorySize > options.maxCentralDirectoryBytes) {
      throw new Error(
        `Central directory is ${formatBytes(
          centralDirectoryMetadata.centralDirectorySize
        )}, above the smoke scan limit of ${formatBytes(options.maxCentralDirectoryBytes)}.`
      );
    }

    const centralDirectoryBuffer = await readBuffer(
      handle,
      centralDirectoryMetadata.centralDirectorySize,
      centralDirectoryMetadata.centralDirectoryOffset
    );
    readBytes += centralDirectoryBuffer.length;

    const parsed = parseCentralDirectory(centralDirectoryBuffer, options);
    const endedAt = performance.now();
    const endMemory = process.memoryUsage();

    return {
      fileName: path.basename(resolvedPath),
      fileSize: stat.size,
      zip64: centralDirectoryMetadata.zip64,
      declaredEntryCount: centralDirectoryMetadata.entryCount,
      entryCount: parsed.entryCount,
      fileEntryCount: parsed.fileEntryCount,
      centralDirectorySize: centralDirectoryMetadata.centralDirectorySize,
      centralDirectoryOffset: centralDirectoryMetadata.centralDirectoryOffset,
      readBytes,
      scanDurationMs: Math.round(endedAt - startedAt),
      memory: {
        rssDeltaBytes: endMemory.rss - startMemory.rss,
        heapUsedDeltaBytes: endMemory.heapUsed - startMemory.heapUsed
      },
      archiveBrowserEntryCount: parsed.archiveBrowserEntryCount,
      historyCandidateCount: parsed.historyCandidates.length,
      historyCandidates: parsed.historyCandidates,
      pathTraversalEntryCount: parsed.pathTraversalEntryCount,
      oversizedEntryCount: parsed.oversizedEntryCount,
      largestEntryCompressedSize: parsed.largestEntryCompressedSize,
      largestEntryUncompressedSize: parsed.largestEntryUncompressedSize,
      privacy: {
        readEntryContents: false,
        includesEntryContents: false,
        includesWatchTitles: false,
        includesWatchUrls: false
      }
    };
  } finally {
    await handle.close();
  }
}

function printHumanResult(result) {
  console.log("Large Takeout structure smoke");
  console.log(`File: ${result.fileName}`);
  console.log(`Size: ${formatBytes(result.fileSize)}`);
  console.log(`Entries: ${result.entryCount.toLocaleString("en-US")}`);
  console.log(`File entries: ${result.fileEntryCount.toLocaleString("en-US")}`);
  console.log(`Read for scan: ${formatBytes(result.readBytes)}`);
  console.log(`Central directory: ${formatBytes(result.centralDirectorySize)}`);
  console.log(`Duration: ${result.scanDurationMs} ms`);
  console.log(`Memory RSS delta: ${formatBytes(result.memory.rssDeltaBytes)}`);
  console.log(`Memory heap delta: ${formatBytes(result.memory.heapUsedDeltaBytes)}`);
  console.log(`Watch-history candidates: ${result.historyCandidateCount}`);

  for (const candidate of result.historyCandidates) {
    console.log(
      `- ${candidate.label} (${candidate.type}, compressed ${formatBytes(candidate.compressedSize)}, uncompressed ${formatBytes(
        candidate.uncompressedSize
      )})`
    );
  }

  console.log(`archive_browser.html entries: ${result.archiveBrowserEntryCount}`);
  console.log(`Path traversal suspects: ${result.pathTraversalEntryCount}`);
  console.log(`Oversized entries: ${result.oversizedEntryCount}`);
  console.log(`Largest entry compressed: ${formatBytes(result.largestEntryCompressedSize)}`);
  console.log(`Largest entry uncompressed: ${formatBytes(result.largestEntryUncompressedSize)}`);
  console.log("Privacy: entry contents were not read; titles and URLs were not printed.");
}

const args = parseArgs(process.argv.slice(2));

if (!args.filePath) {
  console.error("Usage: node scripts/smoke-large-takeout.mjs <takeout.zip> [--json]");
  process.exitCode = 1;
} else {
  try {
    const result = await scanZipStructure(args.filePath, args);
    if (args.json) {
      console.log(JSON.stringify(result));
    } else {
      printHumanResult(result);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Large Takeout structure smoke failed: ${message}`);
    process.exitCode = 1;
  }
}
