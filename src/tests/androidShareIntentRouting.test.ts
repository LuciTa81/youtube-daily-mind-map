import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routingDocPath = join(process.cwd(), "docs", "checklists", "android-share-intent-routing.md");
const manifestPath = join(process.cwd(), "android", "app", "src", "main", "AndroidManifest.xml");

function readText(path: string): string {
  return readFileSync(path, "utf8");
}

describe("Android share intent routing audit", () => {
  it("documents the dedicated share receiver as the public ACTION_SEND target", () => {
    const doc = readText(routingDocPath);
    const manifest = readText(manifestPath);
    const mainActivitySection = manifest.slice(
      manifest.indexOf('android:name=".MainActivity"'),
      manifest.indexOf('android:name=".ShareReceiverActivity"')
    );
    const shareReceiverSection = manifest.slice(manifest.indexOf('android:name=".ShareReceiverActivity"'));

    expect(doc).toContain("Android Share Intent Routing Audit");
    expect(doc).toContain("text/plain");
    expect(doc).toContain("ACTION_SEND");
    expect(doc).toContain("com.lucita81.youtubedailymindmap/.ShareReceiverActivity");
    expect(doc).toContain("remains the launcher and WebView host");

    expect(mainActivitySection).toContain("android.intent.action.MAIN");
    expect(mainActivitySection).not.toContain("android.intent.action.SEND");
    expect(shareReceiverSection).toContain('android:name=".ShareReceiverActivity"');
    expect(shareReceiverSection).toContain("android.intent.action.SEND");
    expect(shareReceiverSection).toContain('android:mimeType="text/plain"');
  });

  it("keeps smoke interpretation tied to resolver evidence, not foreground activity alone", () => {
    const doc = readText(routingDocPath);

    expect(doc).toContain("If a YouTube share appears to bring `MainActivity` to the foreground");
    expect(doc).toContain("that is not automatically a routing failure");
    expect(doc).toContain("installed-package resolver table");
    expect(doc).toContain("The installed package resolver maps `text/plain` `ACTION_SEND` to `.MainActivity`");
  });

  it("keeps future native fast-save work inside the bridge and privacy boundaries", () => {
    const doc = readText(routingDocPath);

    expect(doc).toContain("Keep the public `ACTION_SEND` target on `ShareReceiverActivity`");
    expect(doc).toContain("Keep durable records in the existing web/domain save path");
    expect(doc).toContain("typed native bridge");
    expect(doc).toContain("Do not add overlay permissions");
    expect(doc).toContain("Do not trigger remote AI from the native receiver");
    expect(doc).toContain("Do not log raw shared text, URLs, titles, notes, or pending-share payloads");
    expect(doc).toContain("Filtered logcat privacy smoke");
  });
});
