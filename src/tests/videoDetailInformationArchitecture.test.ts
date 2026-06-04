import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const detailIaPath = join(process.cwd(), "docs", "video-detail-information-architecture.md");

function readDetailIa(): string {
  return readFileSync(detailIaPath, "utf8");
}

describe("video detail information architecture", () => {
  it("keeps Video Detail nested rather than a bottom tab", () => {
    const ia = readDetailIa();

    expect(ia).toContain("It is not a new bottom tab.");
    expect(ia).toContain("Home saved-memory preview");
    expect(ia).toContain("Library saved-video card");
    expect(ia).toContain("Timeline record card");
    expect(ia).toContain("Reports recall candidate");
    expect(ia).toContain("Mind map video node");
    expect(ia).toContain("Back navigation must return to the surface that opened it.");
  });

  it("defines the first-screen video and memory metadata", () => {
    const ia = readDetailIa();

    expect(ia).toContain("Thumbnail when available.");
    expect(ia).toContain("Title.");
    expect(ia).toContain("Channel name or `채널 없음`.");
    expect(ia).toContain("Source badge such as `YouTube 공유`, `Takeout`, `수동 추가`, or `샘플`.");
    expect(ia).toContain("Local record time using the user's timezone.");
    expect(ia).toContain("Saved or last edited date when memory metadata exists.");
    expect(ia).toContain("`기억할 영상`");
    expect(ia).toContain("`나중에 복습`");
    expect(ia).toContain("`그냥 저장`");
    expect(ia).toContain("Open YouTube action when a source URL exists.");
  });

  it("keeps edit behavior limited to local memory metadata", () => {
    const ia = readDetailIa();

    expect(ia).toContain("Editing is limited to local memory metadata");
    expect(ia).toContain("Change memory tag.");
    expect(ia).toContain("Add, update, or clear the user memo.");
    expect(ia).toContain("Save the edited timestamp as `memoryUpdatedAt`.");
    expect(ia).toContain("Editing Takeout source text.");
    expect(ia).toContain("Editing original watchedAt values.");
    expect(ia).toContain("Bulk editing other records.");
    expect(ia).toContain("Calling an AI provider automatically.");
  });

  it("separates removing Takeout memory metadata from deleting manual shared records", () => {
    const ia = readDetailIa();

    expect(ia).toContain("The page must distinguish between deleting a memory and deleting a viewing record.");
    expect(ia).toContain("For a Takeout-backed record that the user marked or annotated:");
    expect(ia).toContain("clears `memoryTag`, `memoryNote`, and `memoryUpdatedAt`");
    expect(ia).toContain("The original viewing record remains in Timeline, reports, and date counts");
    expect(ia).toContain("For a manual/shared-only record:");
    expect(ia).toContain("removes the local manual/shared record from Library, Home memory surfaces, Timeline, and reports");
    expect(ia).toContain("The action requires confirmation.");
    expect(ia).toContain("does not touch Google Takeout archives, Google Drive files, YouTube accounts, or remote services");
  });

  it("keeps optional AI insight explicit, quota-aware, cached, and deletable", () => {
    const ia = readDetailIa();

    expect(ia).toContain("No automatic summary on page open.");
    expect(ia).toContain("No automatic summary immediately after share save.");
    expect(ia).toContain("`AI 요약 만들기`");
    expect(ia).toContain("check quota or credit before a remote AI call");
    expect(ia).toContain("cache successful insight for the same input");
    expect(ia).toContain("delete persisted AI insight");
    expect(ia).toContain("Failure must leave the local memory metadata intact.");
  });

  it("preserves local-first privacy and honest record language", () => {
    const ia = readDetailIa();

    expect(ia).toContain("Do not upload titles, URLs, thumbnails, notes, or same-day context by default.");
    expect(ia).toContain("Do not log full titles, URLs, notes, OAuth tokens, Drive tokens, or native pending-share payloads.");
    expect(ia).toContain("Keep edit and delete operations in the existing local storage path.");
    expect(ia).toContain("viewing record");
    expect(ia).not.toContain("watch time");
    expect(ia).not.toContain("usage time");
    expect(ia).not.toContain("시청 시간");
    expect(ia).not.toContain("사용 시간");
  });
});
