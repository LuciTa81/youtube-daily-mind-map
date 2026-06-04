import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const manifestPath = join(process.cwd(), "android", "app", "src", "main", "AndroidManifest.xml");
const shareReceiverActivityPath = join(
  process.cwd(),
  "android",
  "app",
  "src",
  "main",
  "java",
  "com",
  "lucita81",
  "youtubedailymindmap",
  "ShareReceiverActivity.java"
);
const nativeShareQueuePath = join(
  process.cwd(),
  "android",
  "app",
  "src",
  "main",
  "java",
  "com",
  "lucita81",
  "youtubedailymindmap",
  "NativeShareIntentQueue.java"
);
const nativeSharePluginPath = join(
  process.cwd(),
  "android",
  "app",
  "src",
  "main",
  "java",
  "com",
  "lucita81",
  "youtubedailymindmap",
  "NativeShareIntentPlugin.java"
);
const nativeShareWrapperPath = join(process.cwd(), "src", "lib", "native", "nativeShareIntent.ts");
const nativeAppLifecyclePath = join(process.cwd(), "src", "lib", "native", "nativeAppLifecycle.ts");
const appShellPath = join(process.cwd(), "src", "components", "layout", "AppShell.tsx");

function readText(path: string): string {
  return readFileSync(path, "utf8");
}

describe("native ShareReceiverActivity implementation", () => {
  it("routes Android text shares to the dedicated receiver instead of MainActivity", () => {
    const manifest = readText(manifestPath);
    const mainActivitySection = manifest.slice(
      manifest.indexOf('android:name=".MainActivity"'),
      manifest.indexOf('android:name=".ShareReceiverActivity"')
    );
    const shareReceiverSection = manifest.slice(manifest.indexOf('android:name=".ShareReceiverActivity"'));

    expect(mainActivitySection).toContain("android.intent.action.MAIN");
    expect(mainActivitySection).not.toContain("android.intent.action.SEND");
    expect(shareReceiverSection).toContain("android:name=\".ShareReceiverActivity\"");
    expect(shareReceiverSection).toContain("android:theme=\"@style/AppTheme.ShareReceiver\"");
    expect(shareReceiverSection).toContain("android:excludeFromRecents=\"true\"");
    expect(shareReceiverSection).toContain("android:noHistory=\"true\"");
    expect(shareReceiverSection).toContain("android.intent.action.SEND");
    expect(shareReceiverSection).toContain("android:mimeType=\"text/plain\"");
  });

  it("keeps the native receiver lightweight and non-overlay", () => {
    const receiver = readText(shareReceiverActivityPath);

    expect(receiver).toContain("NativeShareIntentQueue.enqueue(this, intent)");
    expect(receiver).toContain("NativeShareIntentQueue.isQuickShareSaveEnabled(this)");
    expect(receiver).toContain("Toast.makeText(this, getString(R.string.quick_share_queued_message)");
    expect(receiver).toContain("MainActivity.class");
    expect(receiver).toContain("overridePendingTransition(R.anim.quick_share_noop, R.anim.quick_share_noop)");
    expect(receiver).not.toContain("SYSTEM_ALERT_WINDOW");
    expect(receiver).not.toContain("Log.");
  });

  it("persists only a bounded app-private pending-share queue", () => {
    const queue = readText(nativeShareQueuePath);

    expect(queue).toContain("getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)");
    expect(queue).toContain("KEY_PENDING_SHARES");
    expect(queue).toContain("MAX_PENDING_SHARES = 20");
    expect(queue).toContain("MAX_PENDING_AGE_MS");
    expect(queue).toContain("pendingShareId");
    expect(queue).toContain("queuedAtMillis");
    expect(queue).toContain("source\", \"android-share\"");
    expect(queue).toContain("acknowledge(Context context, JSONArray ids)");
    expect(queue).toContain("static synchronized void clear(Context context)");
    expect(queue).not.toContain("IndexedDB");
    expect(queue).not.toContain("Log.");
  });

  it("exposes drain, ack, clear, and quick-share setting through the typed bridge", () => {
    const plugin = readText(nativeSharePluginPath);
    const wrapper = readText(nativeShareWrapperPath);

    expect(plugin).toContain("public void drainPendingShares(PluginCall call)");
    expect(plugin).toContain("public void ackPendingShares(PluginCall call)");
    expect(plugin).toContain("public void clearPendingShares(PluginCall call)");
    expect(plugin).toContain("public void setQuickShareSaveEnabled(PluginCall call)");
    expect(plugin).toContain("NativeShareIntentQueue.drain(getContext())");
    expect(plugin).toContain("result.put(\"shares\", toShareArray(NativeShareIntentQueue.drain(getContext())))");
    expect(plugin).toContain("private static JSArray toShareArray(JSONArray shares)");
    expect(plugin).toContain("instance.notifyListeners(\"shareReceived\", toShareEvent(share))");
    expect(plugin).toContain("NativeShareIntentQueue.acknowledge(getContext(), ids)");
    expect(plugin).not.toContain("consumePendingShare");

    expect(wrapper).toContain("export async function drainPendingNativeShareIntents()");
    expect(wrapper).toContain("export async function ackPendingNativeShareIntents(ids: string[])");
    expect(wrapper).toContain("export async function clearNativePendingShareIntents()");
    expect(wrapper).toContain("export async function setNativeQuickShareSaveEnabled(enabled: boolean)");
    expect(wrapper).not.toContain("consumePendingNativeShareIntent");
  });

  it("drains native shares through the existing shared-video save path and acks after handling", () => {
    const appShell = readText(appShellPath);
    const nativeAppLifecycle = readText(nativeAppLifecyclePath);

    expect(appShell).toContain("setNativeQuickShareSaveEnabled(userSettings.quickShareSaveEnabled)");
    expect(appShell).toContain("drainPendingNativeShareIntents()");
    expect(appShell).toContain("addNativeAppResumeListener");
    expect(nativeAppLifecycle).toContain('App.addListener("resume", callback)');
    expect(appShell).toContain("saveSharedYouTubeVideo(options.baseItems, detail, dateSettings)");
    expect(appShell).toContain("ackPendingNativeShareIntents(handledPendingShareIds)");
    expect(appShell).toContain("clearNativePendingShareIntents().catch(() => undefined)");
    expect(appShell).not.toContain("consumePendingNativeShareIntent()");
  });
});
