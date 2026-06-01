import type { WatchItem } from "@/types/watch";
import { extractYouTubeVideoId } from "@/lib/youtube/videoMetadata";

function normalizeIdentityPart(value?: string): string {
  return (value ?? "")
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("ko-KR")
    .replace(/\s+/g, " ");
}

function normalizeWatchedAt(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? normalizeIdentityPart(value) : parsed.toISOString();
}

export function getWatchRecordKey(item: WatchItem): string {
  const watchedAt = normalizeWatchedAt(item.watchedAt);
  const videoId = extractYouTubeVideoId(item.url);

  if (videoId) {
    return `youtube:${videoId}:${watchedAt}`;
  }

  return [
    "fallback",
    normalizeIdentityPart(item.title),
    normalizeIdentityPart(item.channelName),
    watchedAt
  ].join(":");
}
