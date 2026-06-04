import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const iaPath = join(process.cwd(), "docs", "library-information-architecture.md");

function readIa(): string {
  return readFileSync(iaPath, "utf8");
}

describe("library information architecture", () => {
  it("keeps Library distinct from Home, Timeline, Reports, and Settings", () => {
    const ia = readIa();

    expect(ia).toContain("Library: videos the user saved, tagged, or annotated.");
    expect(ia).toContain("Timeline: all viewing records available");
    expect(ia).toContain("Home: today's memory summary");
    expect(ia).toContain("Reports: weekly or monthly patterns");
    expect(ia).toContain("Settings: import, privacy, deletion, help, and app preferences.");
  });

  it("defines bottom destinations separately from nested detail pages", () => {
    const ia = readIa();

    expect(ia).toContain("Bottom tabs are for primary destinations only.");
    expect(ia).toContain("A saved-video card opens Video Detail.");
    expect(ia).toContain("Nested pages are allowed and expected.");
    expect(ia).toContain("Import and privacy controls live under Settings");
  });

  it("locks the saved-video filter taxonomy and default ordering", () => {
    const ia = readIa();

    expect(ia).toContain("`all`");
    expect(ia).toContain("전체");
    expect(ia).toContain("`remember`");
    expect(ia).toContain("기억할 영상");
    expect(ia).toContain("`review`");
    expect(ia).toContain("`review-later` product alias");
    expect(ia).toContain("나중에 복습");
    expect(ia).toContain("`saved`");
    expect(ia).toContain("그냥 저장");
    expect(ia).toContain("Default ordering is newest saved first across all filters.");
    expect(ia).toContain("Future priority sorting can be added later");
  });

  it("keeps Takeout-backed records out of Library until the user saves them", () => {
    const ia = readIa();

    expect(ia).toContain("Timeline includes Takeout-backed viewing records.");
    expect(ia).toContain("Saved videos are highlighted in Timeline");
    expect(ia).toContain("it is not a Library item until the user intentionally saves or marks it");
  });

  it("keeps AI optional and privacy local-first", () => {
    const ia = readIa();

    expect(ia).toContain("It should not automatically call an AI provider.");
    expect(ia).toContain("explicit user action, quota check, cache, and deletion path");
    expect(ia).toContain("Library data is personal data and must remain local-first by default.");
    expect(ia).toContain("Saved URLs, notes, titles, and thumbnails must not be uploaded by default.");
    expect(ia).toContain("Debug logs must not include full URLs, titles, notes, OAuth tokens, or Drive tokens.");
  });

  it("uses honest viewing-record language and avoids duration claims", () => {
    const ia = readIa();

    expect(ia).toContain("viewing record count language");
    expect(ia).not.toContain("watch time");
    expect(ia).not.toContain("usage time");
    expect(ia).not.toContain("사용 시간");
    expect(ia).not.toContain("시청 시간");
  });
});
