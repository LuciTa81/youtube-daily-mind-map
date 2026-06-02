import { describe, expect, it } from "vitest";
import {
  buildWatchItemFromSharedYouTubePayload,
  extractSharedYouTubeUrl,
  saveSharedYouTubeVideo
} from "@/lib/share/sharedYouTubeVideo";
import type { DateSettings, WatchItem } from "@/types/watch";

const dateSettings: DateSettings = {
  timezone: "Asia/Seoul",
  boundaryMode: "calendar-day",
  lifestyleBoundaryHour: 4
};

function existingItem(overrides: Partial<WatchItem> = {}): WatchItem {
  return {
    id: overrides.id ?? "existing",
    title: overrides.title ?? "Existing video",
    url: overrides.url ?? "https://www.youtube.com/watch?v=abc123",
    watchedAt: overrides.watchedAt ?? "2026-06-02T03:00:00.000Z",
    source: overrides.source ?? "manual"
  };
}

describe("shared YouTube video import", () => {
  it("extracts supported YouTube URLs from shared text", () => {
    expect(extractSharedYouTubeUrl("좋은 영상\nhttps://youtu.be/abc123")).toBe("https://youtu.be/abc123");
    expect(extractSharedYouTubeUrl("https://www.youtube.com/shorts/short123?si=share")).toBe(
      "https://www.youtube.com/shorts/short123?si=share"
    );
    expect(extractSharedYouTubeUrl("https://example.com/not-youtube")).toBeUndefined();
  });

  it("builds a manual WatchItem from an Android share payload", () => {
    const item = buildWatchItemFromSharedYouTubePayload({
      subject: "Next.js App Router 강의",
      text: "https://www.youtube.com/watch?v=next01",
      receivedAt: "2026-06-02T12:00:00.000Z"
    });

    expect(item).toMatchObject({
      title: "Next.js App Router 강의",
      url: "https://www.youtube.com/watch?v=next01",
      watchedAt: "2026-06-02T12:00:00.000Z",
      source: "manual"
    });
  });

  it("builds a WatchItem from a common YouTube app share payload", () => {
    const item = buildWatchItemFromSharedYouTubePayload({
      subject: "Smoke Shared Video",
      text: "Smoke Shared Video\nhttps://youtu.be/dQw4w9WgXcQ?si=share-test",
      receivedAt: "2026-06-02T12:00:00.000Z"
    });

    expect(item).toMatchObject({
      title: "Smoke Shared Video",
      url: "https://youtu.be/dQw4w9WgXcQ?si=share-test",
      watchedAt: "2026-06-02T12:00:00.000Z",
      source: "manual"
    });
  });

  it("builds a WatchItem from the installed YouTube app chooser payload shape", () => {
    const item = buildWatchItemFromSharedYouTubePayload({
      subject: "Me at the zoo",
      text: "https://youtube.com/watch?v=jNQXAC9IVRw&si=DQI4q_Wvvjy3k0Pp",
      receivedAt: "2026-06-02T12:00:00.000Z"
    });

    expect(item).toMatchObject({
      title: "Me at the zoo",
      url: "https://youtube.com/watch?v=jNQXAC9IVRw&si=DQI4q_Wvvjy3k0Pp",
      watchedAt: "2026-06-02T12:00:00.000Z",
      source: "manual"
    });
  });

  it("deduplicates the same shared video on the same calendar date", () => {
    const first = saveSharedYouTubeVideo(
      [],
      {
        subject: "Video one",
        text: "https://www.youtube.com/watch?v=abc123",
        receivedAt: "2026-06-02T01:00:00.000Z"
      },
      dateSettings
    );
    const second = saveSharedYouTubeVideo(
      first?.items ?? [],
      {
        subject: "Video one again",
        text: "https://youtu.be/abc123",
        receivedAt: "2026-06-02T12:00:00.000Z"
      },
      dateSettings
    );

    expect(first?.added).toBe(true);
    expect(second?.added).toBe(false);
    expect(second?.items).toHaveLength(1);
    expect(second?.duplicateItem?.url).toBe("https://www.youtube.com/watch?v=abc123");
  });

  it("keeps the same shared video on another date", () => {
    const result = saveSharedYouTubeVideo(
      [existingItem({ watchedAt: "2026-06-02T03:00:00.000Z" })],
      {
        subject: "Existing video",
        text: "https://youtu.be/abc123",
        receivedAt: "2026-06-03T03:00:00.000Z"
      },
      dateSettings
    );

    expect(result?.added).toBe(true);
    expect(result?.items).toHaveLength(2);
  });
});
