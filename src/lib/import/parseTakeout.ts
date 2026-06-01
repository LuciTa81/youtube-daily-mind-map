import JSZip from "jszip";
import type { WatchItem } from "@/types/watch";

type TakeoutJsonEntry = {
  header?: string;
  title?: string;
  titleUrl?: string;
  subtitles?: Array<{
    name?: string;
    url?: string;
  }>;
  time?: string;
};

export type ParsedWatchHistory = {
  items: WatchItem[];
  skippedCount: number;
  source: "takeout-html" | "takeout-json" | "takeout-zip";
  parserSource?: "takeout-html" | "takeout-json";
  matchedFileName?: string;
  archiveEntryCount?: number;
};

const YOUTUBE_WATCH_PATTERNS = ["youtube.com/watch", "youtu.be/", "music.youtube.com/watch"];
const ZIP_FILE_EXTENSIONS = [".zip"];
const TEXT_HISTORY_FILE_EXTENSIONS = [".json", ".html", ".htm"];

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) => String.fromCharCode(parseInt(code, 16)));
}

function stripTags(value: string): string {
  return decodeHtml(value.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
}

function normalizeUrl(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const decoded = decodeHtml(value.trim());
  if (decoded.startsWith("http")) {
    return decoded;
  }

  if (decoded.startsWith("//")) {
    return `https:${decoded}`;
  }

  return decoded;
}

function stripWatchedPrefix(title: string): string {
  return title
    .replace(/^Watched\s+/i, "")
    .replace(/^You watched\s+/i, "")
    .replace(/^시청한 동영상:\s*/i, "")
    .replace(/^시청함:\s*/i, "")
    .replace(/^시청함\s*/i, "")
    .trim();
}

function makeId(source: "takeout-html" | "takeout-json", index: number, seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return `${source}-${index}-${hash.toString(36)}`;
}

function parseDateText(rawDateText: string): string | undefined {
  const normalized = decodeHtml(rawDateText)
    .replace(/\u202f/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const timezoneAdjusted = normalized
    .replace(/\bKST\b/g, "GMT+0900")
    .replace(/\bJST\b/g, "GMT+0900")
    .replace(/\bUTC\b/g, "GMT");
  const direct = new Date(timezoneAdjusted);

  if (!Number.isNaN(direct.getTime())) {
    return direct.toISOString();
  }

  const koreanMatch = normalized.match(
    /(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?\s*(오전|오후)?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/
  );
  if (koreanMatch) {
    const [, year, month, day, meridiem, hourText, minute, second = "00"] = koreanMatch;
    let hour = Number(hourText);
    if (meridiem === "오후" && hour < 12) {
      hour += 12;
    }
    if (meridiem === "오전" && hour === 12) {
      hour = 0;
    }

    const isoLike = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${String(hour).padStart(
      2,
      "0"
    )}:${minute}:${second.padStart(2, "0")}+09:00`;
    const parsed = new Date(isoLike);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  }

  const slashMatch = normalized.match(
    /(\d{4})[-/](\d{1,2})[-/](\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/
  );
  if (slashMatch) {
    const [, year, month, day, hour, minute, second = "00"] = slashMatch;
    const isoLike = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${hour.padStart(
      2,
      "0"
    )}:${minute}:${second.padStart(2, "0")}+09:00`;
    const parsed = new Date(isoLike);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  }

  return undefined;
}

function parseJsonEntry(entry: TakeoutJsonEntry, index: number): WatchItem | undefined {
  if (!entry.time || !entry.title) {
    return undefined;
  }

  const watchedAt = parseDateText(entry.time);
  if (!watchedAt) {
    return undefined;
  }

  const channel = entry.subtitles?.[0];
  const title = stripWatchedPrefix(entry.title);

  if (!title) {
    return undefined;
  }

  return {
    id: makeId("takeout-json", index, `${title}-${entry.time}-${entry.titleUrl ?? ""}`),
    title,
    url: normalizeUrl(entry.titleUrl),
    channelName: channel?.name?.trim() || undefined,
    channelUrl: normalizeUrl(channel?.url),
    watchedAt,
    rawDateText: entry.time,
    source: "takeout-json"
  };
}

export function parseTakeoutJson(content: string): ParsedWatchHistory {
  const parsed: unknown = JSON.parse(content);
  if (!Array.isArray(parsed)) {
    throw new Error("JSON 배열 형식의 YouTube 시청 기록 파일이 아닙니다.");
  }

  const items: WatchItem[] = [];
  let skippedCount = 0;

  parsed.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") {
      skippedCount += 1;
      return;
    }

    const item = parseJsonEntry(entry as TakeoutJsonEntry, index);
    if (item) {
      items.push(item);
    } else {
      skippedCount += 1;
    }
  });

  return { items, skippedCount, source: "takeout-json" };
}

type Anchor = {
  href?: string;
  text: string;
};

function extractAnchors(block: string): Anchor[] {
  const anchors: Anchor[] = [];
  const anchorPattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorPattern.exec(block))) {
    const hrefMatch = match[1].match(/\bhref=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    anchors.push({
      href: normalizeUrl(hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3]),
      text: stripTags(match[2])
    });
  }

  return anchors;
}

function extractRawLines(block: string): string[] {
  return block
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(div|p|li)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .split("\n")
    .map((line) => decodeHtml(line).replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function splitHtmlIntoHistoryBlocks(content: string): string[] {
  const outerCellMatches = content.match(/<div\b[^>]*class=["'][^"']*outer-cell[^"']*["'][\s\S]*?(?=<div\b[^>]*class=["'][^"']*outer-cell|<\/body>|$)/gi);
  if (outerCellMatches && outerCellMatches.length > 0) {
    return outerCellMatches;
  }

  const bodyMatches = content.match(/<div\b[^>]*class=["'][^"']*content-cell[^"']*["'][\s\S]*?<\/div>/gi);
  if (bodyMatches && bodyMatches.length > 0) {
    return bodyMatches;
  }

  return content.split(/<hr\s*\/?>/gi);
}

function lineLooksLikeDate(line: string): boolean {
  return Boolean(
    parseDateText(line) &&
      (/(\d{4})|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|오전|오후|KST|UTC/i.test(line))
  );
}

function parseHtmlBlock(block: string, index: number): WatchItem | undefined {
  const anchors = extractAnchors(block);
  const titleAnchor =
    anchors.find((anchor) => anchor.href && YOUTUBE_WATCH_PATTERNS.some((pattern) => anchor.href?.includes(pattern))) ??
    anchors[0];

  if (!titleAnchor?.text) {
    return undefined;
  }

  const channelAnchor = anchors.find((anchor) => anchor !== titleAnchor && anchor.text);
  const lines = extractRawLines(block);
  const rawDateText = [...lines].reverse().find(lineLooksLikeDate);
  const watchedAt = rawDateText ? parseDateText(rawDateText) : undefined;

  if (!watchedAt) {
    return undefined;
  }

  const title = stripWatchedPrefix(titleAnchor.text);
  if (!title) {
    return undefined;
  }

  return {
    id: makeId("takeout-html", index, `${title}-${rawDateText}-${titleAnchor.href ?? ""}`),
    title,
    url: normalizeUrl(titleAnchor.href),
    channelName: channelAnchor?.text || undefined,
    channelUrl: normalizeUrl(channelAnchor?.href),
    watchedAt,
    rawDateText,
    source: "takeout-html"
  };
}

export function parseTakeoutHtml(content: string): ParsedWatchHistory {
  const blocks = splitHtmlIntoHistoryBlocks(content);
  const items: WatchItem[] = [];
  let skippedCount = 0;

  blocks.forEach((block, index) => {
    const item = parseHtmlBlock(block, index);
    if (item) {
      items.push(item);
    } else {
      skippedCount += 1;
    }
  });

  return { items, skippedCount, source: "takeout-html" };
}

export function parseTakeoutFile(fileName: string, content: string): ParsedWatchHistory {
  const lowerFileName = fileName.toLocaleLowerCase("ko-KR");

  if (lowerFileName.endsWith(".json") || content.trim().startsWith("[")) {
    return parseTakeoutJson(content);
  }

  if (lowerFileName.endsWith(".html") || lowerFileName.endsWith(".htm") || content.includes("<html")) {
    return parseTakeoutHtml(content);
  }

  throw new Error("지원하는 파일은 YouTube Takeout의 .zip, watch-history.json, watch-history.html입니다.");
}

function isZipFile(fileName: string, fileType?: string): boolean {
  const lowerFileName = fileName.toLocaleLowerCase("ko-KR");
  return ZIP_FILE_EXTENSIONS.some((extension) => lowerFileName.endsWith(extension)) || fileType === "application/zip";
}

function isTextHistoryFile(fileName: string): boolean {
  const lowerFileName = fileName.toLocaleLowerCase("ko-KR");
  return TEXT_HISTORY_FILE_EXTENSIONS.some((extension) => lowerFileName.endsWith(extension));
}

function scoreZipEntry(fileName: string): number {
  const lowerFileName = fileName.replace(/\\/g, "/").toLocaleLowerCase("ko-KR");
  const pathParts = lowerFileName.split("/");
  const baseName = pathParts[pathParts.length - 1] ?? lowerFileName;
  let score = 0;

  if (baseName === "watch-history.json") {
    score += 120;
  }
  if (baseName === "watch-history.html" || baseName === "watch-history.htm") {
    score += 110;
  }
  if (lowerFileName.includes("watch-history")) {
    score += 80;
  }
  if (lowerFileName.includes("youtube")) {
    score += 40;
  }
  if (lowerFileName.includes("history") || lowerFileName.includes("기록")) {
    score += 25;
  }
  if (lowerFileName.endsWith(".json")) {
    score += 8;
  }
  if (lowerFileName.endsWith(".html") || lowerFileName.endsWith(".htm")) {
    score += 6;
  }

  return score;
}

function isPotentialZipHistoryEntry(fileName: string): boolean {
  if (!isTextHistoryFile(fileName)) {
    return false;
  }

  return scoreZipEntry(fileName) > 0;
}

type ZipCandidate = {
  fileName: string;
  file: JSZip.JSZipObject;
  score: number;
};

function getZipCandidates(zip: JSZip): ZipCandidate[] {
  const files = Object.values(zip.files).filter((file) => !file.dir);
  const preferred = files.filter((file) => isPotentialZipHistoryEntry(file.name));
  const fallback = preferred.length > 0 ? preferred : files.filter((file) => isTextHistoryFile(file.name));

  return fallback
    .map((file) => ({ fileName: file.name, file, score: scoreZipEntry(file.name) }))
    .sort((a, b) => b.score - a.score || a.fileName.localeCompare(b.fileName));
}

export async function parseTakeoutZip(fileName: string, content: ArrayBuffer): Promise<ParsedWatchHistory> {
  const zip = await JSZip.loadAsync(content);
  const archiveEntryCount = Object.values(zip.files).filter((file) => !file.dir).length;
  const candidates = getZipCandidates(zip);
  const parseErrors: string[] = [];

  for (const candidate of candidates) {
    try {
      const text = await candidate.file.async("string");
      const parsed = parseTakeoutFile(candidate.fileName, text);

      if (parsed.items.length > 0) {
        return {
          ...parsed,
          source: "takeout-zip",
          parserSource: parsed.source === "takeout-zip" ? undefined : parsed.source,
          matchedFileName: candidate.fileName,
          archiveEntryCount
        };
      }
    } catch (error) {
      parseErrors.push(error instanceof Error ? error.message : `${candidate.fileName} 파일을 읽지 못했습니다.`);
    }
  }

  const detail = parseErrors.length > 0 ? ` 마지막 오류: ${parseErrors[parseErrors.length - 1]}` : "";
  throw new Error(
    `${fileName} 안에서 YouTube 시청 기록을 찾지 못했습니다. Takeout에서 YouTube 및 YouTube Music의 기록을 포함했는지 확인해주세요.${detail}`
  );
}

export async function parseTakeoutBrowserFile(file: File): Promise<ParsedWatchHistory> {
  if (isZipFile(file.name, file.type)) {
    return parseTakeoutZip(file.name, await file.arrayBuffer());
  }

  return parseTakeoutFile(file.name, await file.text());
}
