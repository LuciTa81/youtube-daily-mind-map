import { describe, expect, it } from "vitest";
import {
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl
} from "@/lib/youtube/videoMetadata";

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

  it("keeps synthetic sample ids for identity without requesting remote thumbnails", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=sample044")).toBe("sample044");
    expect(getYouTubeThumbnailUrl("https://www.youtube.com/watch?v=sample044")).toBeUndefined();
    expect(getYouTubeThumbnailUrl("https://youtu.be/sample035")).toBeUndefined();
  });
});
