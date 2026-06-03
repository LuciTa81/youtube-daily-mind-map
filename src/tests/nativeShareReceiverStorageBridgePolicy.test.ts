import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const adrPath = join(process.cwd(), "docs", "adr", "0007-native-share-receiver-storage-bridge.md");
const architecturePath = join(process.cwd(), "docs", "architecture.md");
const risksPath = join(process.cwd(), "docs", "risks.md");
const quickShareAdrPath = join(process.cwd(), "docs", "adr", "0006-quick-share-save-mode.md");
const aiPolicyAdrPath = join(process.cwd(), "docs", "adr", "0005-shared-video-and-ai-insight-policy.md");

function readText(path: string): string {
  return readFileSync(path, "utf8");
}

describe("native share receiver storage bridge policy", () => {
  it("defines a native pending-share queue instead of direct WebView storage writes", () => {
    const adr = readText(adrPath);
    const architecture = readText(architecturePath);
    const risks = readText(risksPath);

    expect(adr).toContain("ShareReceiverActivity");
    expect(adr).toContain("native pending-share queue");
    expect(adr).toContain("app-private native storage");
    expect(adr).toContain("The receiver must not write directly to WebView `IndexedDB`");
    expect(adr).toContain("typed native bridge drains pending shares");
    expect(adr).toContain("existing shared-video save use case");
    expect(adr).toContain("deduplicates same-day shares");
    expect(adr).toContain("acknowledges the native queue item");

    expect(architecture).toContain("native pending-share queue");
    expect(architecture).toContain("rather than writing directly to WebView `IndexedDB`");
    expect(architecture).toContain("typed native bridge");
    expect(architecture).toContain("shared-video save use case");

    expect(risks).toContain("Dedicated native share receiver bypasses web/domain save rules");
    expect(risks).toContain("not direct WebView `IndexedDB` writes");
  });

  it("keeps the queue local, minimal, clearable, and privacy-safe", () => {
    const adr = readText(adrPath);
    const risks = readText(risksPath);

    expect(adr).toContain("minimal pending-share payload");
    expect(adr).toContain("Shared text or URL candidate");
    expect(adr).toContain("Received timestamp");
    expect(adr).toContain("local-only");
    expect(adr).toContain("must not upload shared URLs");
    expect(adr).toContain("must not trigger remote AI");
    expect(adr).toContain("size cap");
    expect(adr).toContain("age or retry cap");
    expect(adr).toContain("explicit clear path");
    expect(adr).toContain("deletion/reset flow clears the native pending-share queue");

    expect(risks).toContain("Native share receiver queue retains personal URLs longer than intended");
    expect(risks).toContain("minimal app-private pending-share queue");
    expect(risks).toContain("clear the queue on local personal-data deletion");
    expect(risks).toContain("never log pending-share payloads");
  });

  it("stays aligned with quick share UX and optional AI policy", () => {
    const adr = readText(adrPath);
    const quickShareAdr = readText(quickShareAdrPath);
    const aiPolicyAdr = readText(aiPolicyAdrPath);

    expect(quickShareAdr).toContain("optional quick share save mode");
    expect(quickShareAdr).toContain("Render an overlay on top of YouTube");
    expect(adr).toContain("Use an Android overlay or draw inside YouTube: rejected");
    expect(adr).toContain("fallback is to route the share through the existing `MainActivity` flow");
    expect(adr).toContain("UI and report copy must continue to avoid watch-duration claims");

    expect(aiPolicyAdr).toContain("AI insights are optional by default");
    expect(aiPolicyAdr).toContain("Automatically summarize every shared video: rejected");
    expect(adr).toContain("Automatically summarize the shared video from the native receiver: rejected");
  });
});
