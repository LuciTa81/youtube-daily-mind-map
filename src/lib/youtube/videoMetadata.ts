import type { WatchItem } from "@/types/watch";

export type VideoMetadata = {
  videoId?: string;
  thumbnailUrl?: string;
};

const syntheticSampleVideoIdPattern = /^sample\d+$/i;

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
  if (!videoId || syntheticSampleVideoIdPattern.test(videoId)) {
    return undefined;
  }

  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function getVideoMetadata(item: WatchItem): VideoMetadata {
  return {
    videoId: extractYouTubeVideoId(item.url),
    thumbnailUrl: getYouTubeThumbnailUrl(item.url)
  };
}
