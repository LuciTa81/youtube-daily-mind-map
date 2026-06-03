import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const adrPath = join(process.cwd(), "docs", "adr", "0005-shared-video-and-ai-insight-policy.md");
const architecturePath = join(process.cwd(), "docs", "architecture.md");
const useCasesPath = join(process.cwd(), "docs", "use-cases.md");
const risksPath = join(process.cwd(), "docs", "risks.md");

function readText(path: string): string {
  return readFileSync(path, "utf8");
}

describe("shared video and AI insight policy", () => {
  it("keeps shared YouTube saves immediate while AI insight stays opt-in", () => {
    const adr = readText(adrPath);

    expect(adr).toContain("Shared YouTube videos are saved immediately");
    expect(adr).toContain("AI insights are optional by default");
    expect(adr).toContain("Show a user-triggered summarize action");
    expect(adr).toContain("must not automatically summarize every Takeout record");
    expect(adr).toContain("Future premium behavior may allow automatic summaries only behind an explicit user setting");
    expect(adr).toContain("daily quota");
    expect(adr).toContain("cost guardrail");
  });

  it("keeps AI behavior behind provider, cache, deletion, and metadata-label guardrails", () => {
    const adr = readText(adrPath);
    const architecture = readText(architecturePath);
    const useCases = readText(useCasesPath);
    const risks = readText(risksPath);

    expect(architecture).toContain("VideoInsightProvider");
    expect(architecture).toContain("RemoteAiInsightProvider");
    expect(architecture).toContain("KeywordInsightProvider");
    expect(adr).toContain("UI components must not call an AI API directly");

    expect(useCases).toContain("User explicitly requests an AI summary");
    expect(useCases).toContain("No automatic bulk AI calls");
    expect(useCases).toContain("Same input is not charged repeatedly");
    expect(useCases).toContain("User can delete the result");

    expect(risks).toContain("AI prompts leak sensitive records");
    expect(risks).toContain("Require explicit opt-in");
    expect(risks).toContain("send minimal fields");

    expect(adr).toContain("The same normalized input should not be charged repeatedly");
    expect(adr).toContain("Only necessary fields may be sent to a remote provider");
    expect(adr).toContain("metadata-only insight must be labeled as metadata-based");
    expect(adr).toContain("must not be presented as a full video-content summary");
  });
});
