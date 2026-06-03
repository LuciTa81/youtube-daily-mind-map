import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const roadmapPath = join(process.cwd(), "docs", "roadmap.md");

function readRoadmap(): string {
  return readFileSync(roadmapPath, "utf8");
}

describe("product roadmap", () => {
  it("keeps the product YouTube-first and Android-primary", () => {
    const roadmap = readRoadmap();

    expect(roadmap).toContain("YouTube-first");
    expect(roadmap).toContain("Android-primary");
    expect(roadmap).toContain("not to expand the data sources");
    expect(roadmap).toContain("without requiring new permissions, remote AI, payments, or phone-only smoke");
  });

  it("separates phone-less work from phone-required release work", () => {
    const roadmap = readRoadmap();

    expect(roadmap).toContain("## Phone-less Priority Queue");
    expect(roadmap).toContain("browser screenshots or DOM evidence");
    expect(roadmap).toContain("Improve daily and weekly memory value without AI");
    expect(roadmap).toContain("## Phone-required Release Queue");
    expect(roadmap).toContain("Standard non-foldable Android phone smoke");
    expect(roadmap).toContain("Real YouTube app share chooser");
    expect(roadmap).toContain("Real Drive large Takeout import");
  });

  it("keeps future bets behind ADR or explicit approval", () => {
    const roadmap = readRoadmap();

    expect(roadmap).toContain("These require ADR or explicit approval before implementation.");
    expect(roadmap).toContain("Optional AI video insight with quota, cache, consent, and deletion.");
    expect(roadmap).toContain("Premium or payment behavior.");
    expect(roadmap).toContain("Broad Google Drive search or broader OAuth scopes.");
    expect(roadmap).toContain("Expansion beyond YouTube");
  });

  it("keeps copy honest about viewing record counts", () => {
    const roadmap = readRoadmap();

    expect(roadmap).toContain("use viewing record counts, not watch time, unless duration data exists");
    expect(roadmap).not.toContain("watch time analysis");
    expect(roadmap).not.toContain("usage time");
  });
});
