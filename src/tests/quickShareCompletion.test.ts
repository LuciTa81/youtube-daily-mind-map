import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getQuickShareCompletionMessage, shouldCompleteQuickShare } from "@/lib/share/quickShareSave";

const appShellPath = join(process.cwd(), "src", "components", "layout", "AppShell.tsx");
const nativeShareWrapperPath = join(process.cwd(), "src", "lib", "native", "nativeShareIntent.ts");
const nativeAppLifecyclePath = join(process.cwd(), "src", "lib", "native", "nativeAppLifecycle.ts");
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

function readSource(path: string): string {
  return readFileSync(path, "utf8");
}

describe("quick share completion", () => {
  it("only completes quick share when the setting is enabled and the record persisted", () => {
    expect(shouldCompleteQuickShare({ quickShareSaveEnabled: true, persisted: true })).toBe(true);
    expect(shouldCompleteQuickShare({ quickShareSaveEnabled: true, persisted: false })).toBe(false);
    expect(shouldCompleteQuickShare({ quickShareSaveEnabled: false, persisted: true })).toBe(false);
    expect(shouldCompleteQuickShare({ quickShareSaveEnabled: false, persisted: false })).toBe(false);
  });

  it("uses short completion messages without watch-duration claims", () => {
    expect(getQuickShareCompletionMessage(true)).toBe("오늘 기록에 저장했어요");
    expect(getQuickShareCompletionMessage(false)).toBe("이미 오늘 기록에 저장돼 있어요");
    expect(getQuickShareCompletionMessage(true)).not.toContain("시청 시간");
    expect(getQuickShareCompletionMessage(true)).not.toContain("사용 시간");
  });

  it("waits for stored settings and saved records before consuming pending Android shares", () => {
    const appShell = readSource(appShellPath);

    expect(appShell).toContain("const [isUserSettingsReady, setIsUserSettingsReady] = useState(false)");
    expect(appShell).toContain("const [isStorageReady, setIsStorageReady] = useState(false)");
    expect(appShell).toContain("setIsUserSettingsReady(true)");
    expect(appShell).toContain("setIsStorageReady(true)");
    expect(appShell).toContain("if (!isUserSettingsReady || !isStorageReady)");
    expect(appShell).toContain(
      "[dateSettings, isStorageReady, isUserSettingsReady, savedWatchItems, userSettings.quickShareSaveEnabled]"
    );
    expect(appShell.indexOf("localUserSettingsRepository.load()")).toBeLessThan(
      appShell.indexOf("drainPendingNativeShareIntents()")
    );
  });

  it("re-drains the native pending queue when the Android app resumes", () => {
    const appShell = readSource(appShellPath);
    const nativeAppLifecycle = readSource(nativeAppLifecyclePath);

    expect(nativeAppLifecycle).toContain("export function addNativeAppResumeListener");
    expect(nativeAppLifecycle).toContain('App.addListener("resume", callback)');
    expect(nativeAppLifecycle).toContain('App.addListener("appStateChange"');
    expect(appShell).toContain("const nativeShareDrainInFlightRef = useRef(false)");
    expect(appShell).toContain("const drainNativePendingShares = async () => {");
    expect(appShell).toContain("if (nativeShareDrainInFlightRef.current)");
    expect(appShell).toContain("void drainNativePendingShares().catch(() => undefined)");
    expect(appShell).toContain("const removeNativeResumeListener = addNativeAppResumeListener");
    expect(appShell).toContain("removeNativeResumeListener()");
  });

  it("skips the memory prompt only for successful quick-share completion", () => {
    const appShell = readSource(appShellPath);

    expect(appShell).toContain("shouldCompleteQuickShare({");
    expect(appShell).toContain("quickShareSaveEnabled: userSettings.quickShareSaveEnabled");
    expect(appShell).toContain("persisted");
    expect(appShell).toContain("if (shouldQuickComplete)");
    expect(appShell).toContain("options.completeQuickShare");
    expect(appShell).toContain("setSharedMemoryItemId(undefined)");
    expect(appShell).toContain("completeNativeQuickShare(getQuickShareCompletionMessage(result.added))");
  });

  it("keeps quick-share home summaries aligned with the latest saved date range", () => {
    const appShell = readSource(appShellPath);

    expect(appShell).toContain(
      "getDateRangeForSelection(selectedDateKey, dateSettings, rangeMode, quickDateAnchor)"
    );
    expect(appShell).toContain("[dateSettings, quickDateAnchor, rangeMode, selectedDateKey]");
    expect(appShell).toContain(
      'getDateRangeForSelection(selectedDateKey, dateSettings, "week", quickDateAnchor)'
    );
    expect(appShell).toContain("[dateSettings, quickDateAnchor, selectedDateKey]");
  });

  it("wraps native quick-share completion behind the typed native bridge", () => {
    const wrapper = readSource(nativeShareWrapperPath);
    const plugin = readSource(nativeSharePluginPath);

    expect(wrapper).toContain("completeQuickShare: (options: { message: string }) => Promise<void>");
    expect(wrapper).toContain("drainPendingShares: () => Promise<NativeShareIntentDrainResult>");
    expect(wrapper).toContain("ackPendingShares: (options: { ids: string[] }) => Promise<void>");
    expect(wrapper).toContain("export async function completeNativeQuickShare(message: string)");
    expect(wrapper).toContain("NativeShareIntent.completeQuickShare({ message })");
    expect(plugin).toContain("public void completeQuickShare(PluginCall call)");
    expect(plugin).toContain("public void drainPendingShares(PluginCall call)");
    expect(plugin).toContain("public void ackPendingShares(PluginCall call)");
    expect(plugin).toContain("Toast.makeText(activity, message, Toast.LENGTH_SHORT).show()");
    expect(plugin).toContain("activity.moveTaskToBack(true)");
    expect(plugin).not.toContain("Log.");
  });
});
