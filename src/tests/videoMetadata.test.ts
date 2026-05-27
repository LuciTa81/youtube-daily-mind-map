import { describe, expect, it } from "vitest";
import {
  buildVideoOneLineSummary,
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl
} from "@/lib/youtube/videoMetadata";
import type { ClassifiedWatchItem } from "@/types/watch";

describe("video metadata utilities", () => {
  it("extracts video ids from common YouTube URLs", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=abc123&t=10s")).toBe("abc123");
    expect(extractYouTubeVideoId("https://youtu.be/xyz789")).toBe("xyz789");
    expect(extractYouTubeVideoId("https://www.youtube.com/shorts/short123")).toBe("short123");
  });

  it("builds a thumbnail URL from a YouTube URL", () => {
    expect(getYouTubeThumbnailUrl("https://www.youtube.com/watch?v=abc123")).toBe(
      "https://i.ytimg.com/vi/abc123/hqdefault.jpg"
    );
  });

  it("builds a one-line summary from classification data", () => {
    const item: ClassifiedWatchItem = {
      id: "v1",
      title: "Next.js App Router 강의",
      watchedAt: "2026-05-27T10:00:00+09:00",
      source: "sample",
      channelName: "생활코딩",
      category: "개발/기술",
      subcategory: "프론트엔드",
      confidence: 0.9
    };

    expect(buildVideoOneLineSummary(item)).toContain("개발/기술 > 프론트엔드");
  });
});
