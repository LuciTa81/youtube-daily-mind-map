import { getDateKeyForItem } from "@/lib/date/dateKeys";
import { extractYouTubeVideoId } from "@/lib/youtube/videoMetadata";
import type { DateSettings, WatchItem } from "@/types/watch";

export type SharedYouTubePayload = {
  text?: string;
  subject?: string;
  receivedAt?: string;
};

export type SharedYouTubeSaveResult = {
  items: WatchItem[];
  item: WatchItem;
  added: boolean;
  duplicateItem?: WatchItem;
};

const URL_PATTERN = /https?:\/\/[^\s"'<>]+/gi;

function cleanUrlCandidate(value: string): string {
  return value.replace(/[)\].,!?]+$/g, "");
}

export function extractSharedYouTubeUrl(text: string): string | undefined {
  const candidates = text.match(URL_PATTERN) ?? [];

  return candidates.map(cleanUrlCandidate).find((url) => Boolean(extractYouTubeVideoId(url)));
}

function normalizeTitleLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function extractTitleFromText(text: string, url: string): string | undefined {
  const withoutUrl = text.replace(url, " ");
  const firstLine = withoutUrl
    .split(/\r?\n/)
    .map(normalizeTitleLine)
    .find(Boolean);

  return firstLine || undefined;
}

export function buildWatchItemFromSharedYouTubePayload(payload: SharedYouTubePayload): WatchItem | undefined {
  const sharedText = payload.text ?? "";
  const sharedSubject = payload.subject ?? "";
  const combinedText = `${sharedSubject}\n${sharedText}`;
  const url = extractSharedYouTubeUrl(combinedText);
  const videoId = extractYouTubeVideoId(url);

  if (!url || !videoId) {
    return undefined;
  }

  const watchedAt = payload.receivedAt ?? new Date().toISOString();
  const title =
    normalizeTitleLine(sharedSubject) ||
    extractTitleFromText(sharedText, url) ||
    `YouTube 영상 ${videoId}`;

  return {
    id: `shared-youtube-${videoId}-${new Date(watchedAt).getTime()}`,
    title,
    url,
    watchedAt,
    rawDateText: watchedAt,
    source: "manual"
  };
}
function isSameSharedVideoOnDate(a: WatchItem, b: WatchItem, settings: DateSettings): boolean {
  const aVideoId = extractYouTubeVideoId(a.url);
  const bVideoId = extractYouTubeVideoId(b.url);

  if (!aVideoId || !bVideoId || aVideoId !== bVideoId) {
    return false;
  }

  return getDateKeyForItem(a, settings) === getDateKeyForItem(b, settings);
}

function sortByNewestFirst(items: WatchItem[]): WatchItem[] {
  return [...items].sort((a, b) => {
    const aTime = new Date(a.watchedAt).getTime();
    const bTime = new Date(b.watchedAt).getTime();
    const safeATime = Number.isFinite(aTime) ? aTime : 0;
    const safeBTime = Number.isFinite(bTime) ? bTime : 0;
    return safeBTime - safeATime || a.id.localeCompare(b.id);
  });
}

export function saveSharedYouTubeVideo(
  existingItems: WatchItem[],
  payload: SharedYouTubePayload,
  settings: DateSettings
): SharedYouTubeSaveResult | undefined {
  const item = buildWatchItemFromSharedYouTubePayload(payload);
  if (!item) {
    return undefined;
  }

  const duplicateItem = existingItems.find((existingItem) =>
    isSameSharedVideoOnDate(existingItem, item, settings)
  );

  if (duplicateItem) {
    return {
      items: sortByNewestFirst(existingItems),
      item,
      added: false,
      duplicateItem
    };
  }

  return {
    items: sortByNewestFirst([...existingItems, item]),
    item,
    added: true
  };
}
