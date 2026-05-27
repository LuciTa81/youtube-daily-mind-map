import type { ClassifiedWatchItem, WatchItem } from "@/types/watch";

export type VideoMetadata = {
  videoId?: string;
  thumbnailUrl?: string;
  oneLineSummary: string;
};

function safeUrl(value: string): URL | undefined {
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}

export function extractYouTubeVideoId(url?: string): string | undefined {
  if (!url) {
    return undefined;
  }

  const parsed = safeUrl(url);
  if (!parsed) {
    return undefined;
  }

  const hostname = parsed.hostname.replace(/^www\./, "");
  if (hostname === "youtu.be") {
    return parsed.pathname.split("/").filter(Boolean)[0];
  }

  if (hostname.endsWith("youtube.com")) {
    const watchId = parsed.searchParams.get("v");
    if (watchId) {
      return watchId;
    }

    const [firstSegment, secondSegment] = parsed.pathname.split("/").filter(Boolean);
    if (["shorts", "embed", "live"].includes(firstSegment ?? "") && secondSegment) {
      return secondSegment;
    }
  }

  return undefined;
}

export function getYouTubeThumbnailUrl(url?: string): string | undefined {
  const videoId = extractYouTubeVideoId(url);
  return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : undefined;
}

export function buildVideoOneLineSummary(item: ClassifiedWatchItem): string {
  const categoryText = item.subcategory
    ? `${item.category} > ${item.subcategory}`
    : item.category;
  const channelText = item.channelName ? `${item.channelName}의 ` : "";

  if (item.category === "기타") {
    return `${channelText}제목 기준으로 아직 명확히 분류되지 않은 시청 기록입니다.`;
  }

  return `${channelText}제목 기준 ${categoryText} 관련 영상으로 분류됐습니다.`;
}

export function getVideoMetadata(item: ClassifiedWatchItem | WatchItem): VideoMetadata {
  const classifiedItem =
    "category" in item
      ? item
      : {
          ...item,
          category: "기타",
          confidence: 0.2
        };

  return {
    videoId: extractYouTubeVideoId(item.url),
    thumbnailUrl: getYouTubeThumbnailUrl(item.url),
    oneLineSummary: buildVideoOneLineSummary(classifiedItem)
  };
}
