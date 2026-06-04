import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const adrPath = join(process.cwd(), "docs", "adr", "0006-quick-share-save-mode.md");
const useCasesPath = join(process.cwd(), "docs", "use-cases.md");
const risksPath = join(process.cwd(), "docs", "risks.md");
const aiAdrPath = join(process.cwd(), "docs", "adr", "0005-shared-video-and-ai-insight-policy.md");

function readText(path: string): string {
  return readFileSync(path, "utf8");
}

describe("quick share save policy", () => {
  it("keeps quick share save optional, local-first, and non-overlay", () => {
    const adr = readText(adrPath);

    expect(adr).toContain("Accepted");
    expect(adr).toContain("optional quick share save mode");
    expect(adr).toContain("saves the shared video immediately");
    expect(adr).toContain("shows a short Android-native confirmation");
    expect(adr).toContain("returns the user to the previous app");
    expect(adr).toContain("must not");
    expect(adr).toContain("Render an overlay on top of YouTube");
    expect(adr).toContain("Request broad overlay permissions");
    expect(adr).toContain("Automatically call remote AI");
    expect(adr).toContain("Claim watch duration");
  });

  it("keeps UC-02 and risks aligned with quick save as friction reduction", () => {
    const adr = readText(adrPath);
    const useCases = readText(useCasesPath);
    const risks = readText(risksPath);

    expect(useCases).toContain("Optional quick share save mode");
    expect(useCases).toContain("show a lightweight confirmation");
    expect(useCases).toContain("return to the previous app");
    expect(risks).toContain("Share save flow interrupts YouTube viewing");
    expect(risks).toContain("saves locally");
    expect(risks).toContain("returns to the previous app");
    expect(adr).toContain("Android real-device smoke");
    expect(adr).toContain("pending-share queue drain");
    expect(adr).toContain("app resume re-drain");
    expect(adr).toContain("full official YouTube share chooser flow");
  });

  it("keeps quick save separate from automatic AI summary policy", () => {
    const quickSaveAdr = readText(adrPath);
    const aiAdr = readText(aiAdrPath);

    expect(quickSaveAdr).toContain("Automatically summarize on share: rejected");
    expect(quickSaveAdr).toContain("ADR 0005 keeps AI insight optional");
    expect(aiAdr).toContain("AI insights are optional by default");
    expect(aiAdr).toContain("Automatically summarize every shared video: rejected");
  });
});
