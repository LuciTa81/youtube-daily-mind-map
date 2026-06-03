import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const agentsPath = join(process.cwd(), "AGENTS.md");
const harnessPath = join(process.cwd(), "docs", "harness.md");
const designChecklistPath = join(process.cwd(), "docs", "checklists", "design-qa.md");

function readDoc(path: string): string {
  return readFileSync(path, "utf8").replace(/\r\n/g, "\n");
}

describe("design QA harness", () => {
  it("keeps UI design rules explicit in AGENTS.md", () => {
    const agents = readDoc(agentsPath);

    expect(agents).toContain("## Design Rules");
    expect(agents).toContain("docs/checklists/design-qa.md");
    expect(agents).toContain("screen evidence");
    expect(agents).toContain("source-code guesswork");
    expect(agents).toContain("360px and 430px");
    expect(agents).toContain("44px");
    expect(agents).toContain("Korean copy wrapping");
    expect(agents).toContain("one-off colors, radii, shadows, or spacing");
  });

  it("keeps the harness workflow and verification ladder aware of design QA", () => {
    const harness = readDoc(harnessPath);

    expect(harness).toContain("| Design QA | `docs/checklists/design-qa.md`");
    expect(harness).toContain("gather screen evidence before visual edits");
    expect(harness).toContain("Design QA smoke for UI/layout changes");
    expect(harness).toContain("360px to 430px mobile evidence");
    expect(harness).toContain("Visual regression screenshots for Home, Import, Timeline, Report, and Mind Map screens");
    expect(harness).toContain("speculative visual-only UI/CSS changes");
  });

  it("documents mobile, hierarchy, polish, evidence, and no-go checks", () => {
    const checklist = readDoc(designChecklistPath);

    expect(checklist).toContain("# Design QA Checklist");
    expect(checklist).toContain("## Required Screen Evidence");
    expect(checklist).toContain("## Mobile First");
    expect(checklist).toContain("360px");
    expect(checklist).toContain("430px");
    expect(checklist).toContain("44px");
    expect(checklist).toContain("Korean copy");
    expect(checklist).toContain("standard non-foldable Android phone coverage");
    expect(checklist).toContain("## Visual Hierarchy");
    expect(checklist).toContain("Mind map views are supporting surfaces");
    expect(checklist).toContain("## Product Polish");
    expect(checklist).toContain("shared UI patterns or design tokens");
    expect(checklist).toContain("must not claim viewing duration");
    expect(checklist).toContain("## Evidence Template");
    expect(checklist).toContain("## No-Go Conditions");
    expect(checklist).toContain("Do not change UI/CSS based only on source-code guesswork");
    expect(checklist).toContain("watch time, usage time, or known viewing duration");
    expect(checklist).toContain("personal data, raw Takeout contents, OAuth tokens");
  });
});
