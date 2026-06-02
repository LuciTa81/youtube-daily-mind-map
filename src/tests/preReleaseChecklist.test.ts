import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const checklistPath = join(process.cwd(), "docs", "checklists", "pre-release-change-summary.md");
const releaseChecklistPath = join(process.cwd(), "docs", "checklists", "release.md");
const nativeDriveFilePluginPath = join(
  process.cwd(),
  "android",
  "app",
  "src",
  "main",
  "java",
  "com",
  "lucita81",
  "youtubedailymindmap",
  "NativeDriveFilePlugin.java"
);

function readChecklist(): string {
  return readFileSync(checklistPath, "utf8");
}

function readReleaseChecklist(): string {
  return readFileSync(releaseChecklistPath, "utf8");
}

function readNativeDriveFilePlugin(): string {
  return readFileSync(nativeDriveFilePluginPath, "utf8");
}

describe("pre-release change summary checklist", () => {
  it("keeps the required harness sections", () => {
    const checklist = readChecklist();

    expect(checklist).toContain("## Product Boundary");
    expect(checklist).toContain("## Current Candidate Scope");
    expect(checklist).toContain("## Privacy And Policy Review");
    expect(checklist).toContain("## Verification Checklist");
    expect(checklist).toContain("## Android Smoke Test Result - 2026-06-02");
    expect(checklist).toContain("## Android Release Privacy Smoke Result - 2026-06-03");
    expect(checklist).toContain("## Android Smoke Checklist Coverage - 2026-06-03");
    expect(checklist).toContain("## Android WebView Thumbnail Smoke Result - 2026-06-03");
    expect(checklist).toContain("## Android Release WebView Thumbnail Smoke Result - 2026-06-03");
    expect(checklist).toContain("## GitHub Actions APK Emulator Clean Install Smoke Result - 2026-06-03");
    expect(checklist).toContain("## GitHub Actions APK Emulator Clean Install Smoke Result - 2026-06-03 (cbe4b9a)");
    expect(checklist).toContain("## GitHub Actions APK Emulator Clean Install Smoke Result - 2026-06-03 (a2e2d01)");
    expect(checklist).toContain("## Current Remaining Risks");
    expect(checklist).toContain("## Go / No-go Notes");
  });

  it("keeps release verification commands visible", () => {
    const checklist = readChecklist();

    expect(checklist).toContain("npm run verify");
    expect(checklist).toContain("npx cap sync android");
    expect(checklist).toContain("android/gradlew assembleDebug");
    expect(checklist).toContain("android/gradlew assembleRelease");
    expect(checklist).toContain("Release APK logcat smoke confirms native import debug logs are silent when the app is not debuggable");
    expect(checklist).toContain("Real Android device smoke test");
    expect(checklist).toContain("[x] YouTube share intent smoke test from the YouTube app");
  });

  it("keeps the latest Android smoke result and release blockers visible", () => {
    const checklist = readChecklist();

    expect(checklist).toContain("Samsung SM-F966N");
    expect(checklist).toContain("App launch and home dashboard rendered");
    expect(checklist).toContain("Android file picker opened Google Drive");
    expect(checklist).toContain("Non-private normal Takeout fixture ZIP with `watch-history.json` was generated");
    expect(checklist).toContain("local structure scan found 1 watch-history candidate");
    expect(checklist).toContain("Direct Drive upload UI opened for the normal fixture from both `file://` and MediaStore `content://` URIs");
    expect(checklist).toContain("direct-upload attempts did not appear in Drive picker search or My Drive listing");
    expect(checklist).toContain("Google Drive app's own `New` -> `Upload` flow found the local fixture in Downloads");
    expect(checklist).toContain("completed `1 upload`");
    expect(checklist).toContain("Android Drive picker search found the uploaded `takeout-codex-normal-20260602.zip` fixture");
    expect(checklist).toContain("Android Drive normal fixture import completed on the real device");
    expect(checklist).toContain("3 added records, 0 duplicates, and 3 saved records");
    expect(checklist).toContain("showed the completion overlay");
    expect(checklist).toContain("reported no candidate when only `Takeout/archive_browser.html` was present");
    expect(checklist).toContain("Reinstalled the current debug APK");
    expect(checklist).toContain("selected the visible user-provided 56.83 kB Drive ZIP");
    expect(checklist).toContain("Native Drive import rejected that ZIP within about 1 second");
    expect(checklist).toContain("archive did not contain YouTube watch-history data");
    expect(checklist).toContain("native rejection did not surface as a visible UI error");
    expect(checklist).toContain("after about 72 seconds");
    expect(checklist).toContain("saved records stayed at 0");
    expect(checklist).toContain("Android Drive duplicate re-import smoke selected the same uploaded normal fixture again");
    expect(checklist).toContain("0 added records, 3 duplicates, and 3 saved records");
    expect(checklist).toContain("native Drive import progress watchdog");
    expect(checklist).toContain("JS native error propagation fix");
    expect(checklist).toContain("listener cleanup cannot block rejected Drive imports");
    expect(checklist).toContain("synced into Android and rebuilt as a debug APK");
    expect(checklist).toContain("reinstalled and re-smoke-tested on the real device");
    expect(checklist).toContain("Follow-up smoke reinstalled the rebuilt debug APK");
    expect(checklist).toContain("surfaced the native rejection as a visible UI error within about 5 seconds");
    expect(checklist).toContain("User-provided 1.62 GiB Takeout ZIP was structure-scanned without reading entry contents");
    expect(checklist).toContain("scan read 75.43 KiB");
    expect(checklist).toContain("found 1 localized Korean HTML watch-history candidate");
    expect(checklist).toContain("3.77 MiB compressed and 47.91 MiB uncompressed");
    expect(checklist).toContain("Google Drive app search for `takeout-20260527T093305Z-3-001` returned no matching selectable Drive file");
    expect(checklist).toContain("Android full import from the 1.62 GiB real ZIP was not executed");
    expect(checklist).toContain("raw Takeout upload to Drive was not performed without a separate user-facing consent flow");
    expect(checklist).toContain("Large-import loading UI was not executed with the 1.62 GiB real ZIP");
    expect(checklist).toContain("Quoted direct ADB `ACTION_SEND` smoke saved a YouTube-like `youtu.be` payload");
    expect(checklist).toContain("Manual share from the installed YouTube app saved `Me at the zoo`");
    expect(checklist).toContain("Import/settings screen explains the YouTube `Share` -> `More` -> app selection path");
    expect(checklist).toContain("YouTube chooser UX still requires `Share` -> `More` -> app selection");
    expect(checklist).toContain("Local deletion/clear-data flow smoke passed after seeding one shared test record");
    expect(checklist).toContain("Foldable settings screen received extra safe-area bottom spacing");
    expect(checklist).toContain("Rechecked foldable settings screen after reinstall");
    expect(checklist).toContain("delete action bounds `[110,1577][969,1656]`");
    expect(checklist).toContain("bottom nav bounds `[0,2241][1080,2520]`");
    expect(checklist).toContain("release APK signed locally for smoke with the Android debug keystore");
    expect(checklist).toContain("verified with APK Signature Scheme v2/v3");
    expect(checklist).toContain("Signed release APK installed over the debug build with `adb install -r`");
    expect(checklist).toContain("with no `DEBUGGABLE` flag");
    expect(checklist).toContain("`adb logcat -d -s NativeDriveFile` produced no output");
    expect(checklist).toContain("refreshed release smoke was required");
    expect(checklist).toContain("refreshed release smoke used a known Drive fixture");
    expect(checklist).toContain("Latest web bundle was synced into Android with `npx cap sync android`");
    expect(checklist).toContain("`android/gradlew assembleRelease` completed");
    expect(checklist).toContain("refreshed release APK was zipaligned, signed locally for smoke");
    expect(checklist).toContain("Android DocumentsUI opened directly to Drive > My Drive > Takeout");
    expect(checklist).toContain("known 56.83 kB Drive ZIP");
    expect(checklist).toContain("surfaced the last Drive import outcome card");
    expect(checklist).toContain("visible outcome card and error box showed");
    expect(checklist).toContain("refreshed release known-Drive-fixture rejection smoke");
    expect(checklist).toContain("Release valid-archive completion and duplicate-summary visibility were re-smoked");
    expect(checklist).toContain("takeout-codex-normal-20260602.zip");
    expect(checklist).toContain("새 기록 0개 추가 · 중복 3개 건너뜀 · 저장된 기록 40103개");
    expect(checklist).toContain("Re-selecting the same Drive-hosted valid fixture");
    expect(checklist).toContain("release valid-fixture completion and duplicate re-import smoke");
    expect(checklist).toContain("Release YouTube share intent smoke opened the installed YouTube app");
    expect(checklist).toContain("Me at the zoo");
    expect(checklist).toContain("tapped YouTube's `공유` button");
    expect(checklist).toContain("selected `YouTube Daily Mind Map` from the Android resolver");
    expect(checklist).toContain("공유한 영상을 오늘의 기록에 저장했습니다. 저장된 기록 1개");
    expect(checklist).toContain("오늘 1개");
    expect(checklist).toContain("03:27 · 기타 Me at the zoo 채널 없음");
    expect(checklist).toContain("기억할 영상");
    expect(checklist).toContain("메모 저장");
    expect(checklist).toContain("`adb logcat -d -s NativeShareIntent NativeShareIntentPlugin ShareIntent` produced no output");
    expect(checklist).toContain("Android WebView Thumbnail Smoke Result - 2026-06-03");
    expect(checklist).toContain("Build commit: `7390e6d436d6b6101e0b44dd91d2a19a1ea8cc01`");
    expect(checklist).toContain("Timeline video thumbnail areas fell back to the local grey placeholder");
    expect(checklist).toContain("sample_related_count=0");
    expect(checklist).toContain("yt_or_404_count=0");
    expect(checklist).toContain("Android Release WebView Thumbnail Smoke Result - 2026-06-03");
    expect(checklist).toContain("Build commit: `518e7087fddab6dbf7d4209450c384edfa9f0a8a`");
    expect(checklist).toContain("app-release-smoke-signed.apk");
    expect(checklist).toContain("verified with APK Signature Scheme v2/v3");
    expect(checklist).toContain("no `DEBUGGABLE` flag");
    expect(checklist).toContain("home_sample_related_count=0");
    expect(checklist).toContain("home_yt_or_404_count=0");
    expect(checklist).toContain("timeline_sample_related_count=0");
    expect(checklist).toContain("timeline_yt_or_404_count=0");
    expect(checklist).toContain("final_sample_related_count=0");
    expect(checklist).toContain("final_yt_or_404_count=0");
    expect(checklist).toContain("GitHub Actions APK Emulator Clean Install Smoke Result - 2026-06-03");
    expect(checklist).toContain("codex_clean_api36");
    expect(checklist).toContain("sdk_gphone64_x86_64");
    expect(checklist).toContain("Build commit: `440856a4eef2cbf003f544645dd83273a1b7b064`");
    expect(checklist).toContain("youtube-daily-mind-map-debug-apk");
    expect(checklist).toContain("Build Android APK` run `26847441070`");
    expect(checklist).toContain("artifact id `7369620624`");
    expect(checklist).toContain("app-debug.apk");
    expect(checklist).toContain("APK Signature Scheme v2 verified true");
    expect(checklist).toContain("C=US, O=Android, CN=Android Debug");
    expect(checklist).toContain("com.lucita81.youtubedailymindmap");
    expect(checklist).toContain("application label `YouTube Daily Mind Map`");
    expect(checklist).toContain("`sdkVersion:'24'` and `targetSdkVersion:'36'`");
    expect(checklist).toContain("system-images;android-36;google_apis;x86_64");
    expect(checklist).toContain("Clean AVD `codex_clean_api36` was launched with `-wipe-data`");
    expect(checklist).toContain("Launcher resolved to `com.lucita81.youtubedailymindmap/.MainActivity`");
    expect(checklist).toContain("Home screen rendered in the emulator screenshot");
    expect(checklist).toContain("Build commit: `cbe4b9a04bfb6bf339f9b5d09115c3c02f4be7d5`");
    expect(checklist).toContain("Build Android APK` run `26848958376`");
    expect(checklist).toContain("artifact id `7370249841`");
    expect(checklist).toContain("size 4,635,778 bytes");
    expect(checklist).toContain("Artifact ZIP downloaded from GitHub Actions; size 4,249,047 bytes");
    expect(checklist).toContain("Installed package was `com.lucita81.youtubedailymindmap`");
    expect(checklist).toContain("versionCode=1");
    expect(checklist).toContain("versionName=1.0");
    expect(checklist).toContain("Initial screenshot showed the Android splash screen");
    expect(checklist).toContain("codex-cbe4b9a-emulator-clean-install-launch-after-wait.png");
    expect(checklist).toContain("`uiautomator dump` included `YouTube Daily Mind Map` after launch");
    expect(checklist).toContain("no emulator remained connected");
    expect(checklist).toContain("did not expose every visible Korean WebView text node");
    expect(checklist).toContain("Build commit: `a2e2d010a14d51885ab85a8dbcaee3c872e6a8ca`");
    expect(checklist).toContain("Build Android APK` run `26849752484`");
    expect(checklist).toContain("artifact id `7370563146`");
    expect(checklist).toContain("Artifact ZIP downloaded from GitHub Actions; size 4,249,049 bytes");
    expect(checklist).toContain("first two emulator boot attempts did not attach to ADB");
    expect(checklist).toContain("stale AVD locks were cleaned before retrying");
    expect(checklist).toContain("headless emulator retry reached `emulator-5582`");
    expect(checklist).toContain("Installed package path was under `/data/app/.../com.lucita81.youtubedailymindmap.../base.apk`");
    expect(checklist).toContain("codex-a2e2d01-emulator-clean-install-launch-initial.png");
    expect(checklist).toContain("codex-a2e2d01-emulator-clean-install-launch-after-wait.png");
    expect(checklist).toContain("Emulator boot was flaky in this run");
    expect(checklist).toContain("process cleanup, ADB restart, and a headless retry");
  });

  it("keeps privacy and product-boundary reminders visible", () => {
    const checklist = readChecklist();

    expect(checklist).toContain("YouTube-first");
    expect(checklist).toContain("Raw Takeout archives must stay local by default");
    expect(checklist).toContain("must not be logged");
    expect(checklist).toContain("without ADR");
    expect(checklist).toContain("rebuilt debug APK");
    expect(checklist).toContain("visible UI error within about 5 seconds");
    expect(checklist).toContain("Android Smoke Checklist Coverage - 2026-06-03");
    expect(checklist).toContain("Invalid or missing watch-history ZIP");
    expect(checklist).toContain("Known 56.83 kB Drive ZIP returned a visible error");
    expect(checklist).toContain("Valid small fixture ZIP");
    expect(checklist).toContain("completed and reported import counts in debug and release smoke");
    expect(checklist).toContain("GitHub Actions debug APK clean-installed and launched on an Android 16 x86_64 emulator");
    expect(checklist).toContain("GitHub Actions debug APK clean-installed and launched on an Android 16 emulator for commits `440856a`, `cbe4b9a`, and `a2e2d01`");
    expect(checklist).toContain("Drive import, YouTube share, duplicate import, deletion, and layout flows were not repeated there");
    expect(checklist).toContain("Android Drive duplicate re-import passed with the small synthetic watch-history fixture");
    expect(checklist).toContain("large real duplicate archives still need performance/storage verification");
    expect(checklist).toContain("localized Korean watch-history candidate");
    expect(checklist).toContain("Android full Drive copy/parsing/loading UI remains unverified");
    expect(checklist).toContain("Release APK native import logcat silence, invalid ZIP rejection visibility");
    expect(checklist).toContain("valid fixture completion, duplicate-summary visibility, and YouTube share behavior passed");
    expect(checklist).toContain("standard phone and additional vendor/device coverage still need review");
    expect(checklist).toContain("Debug and locally smoke-signed release APK WebView thumbnail smoke passed on the Samsung SM-F966N");
    expect(checklist).toContain("Play Store-signed release and real standard phone coverage still need repeat passes");
    expect(checklist).toContain("standard phone layout and long Korean copy still need review");
  });
});

describe("release checklist privacy smoke", () => {
  it("requires release-variant logcat verification before APK sharing", () => {
    const releaseChecklist = readReleaseChecklist();

    expect(releaseChecklist).toContain("Release APK logcat smoke confirms native import debug logs are silent when the app is not debuggable");
    expect(releaseChecklist).toContain("android/gradlew assembleRelease");
    expect(releaseChecklist).toContain(
      "Release APK native import logcat output does not include Drive file names, local cache paths, watched titles, URLs, or native import timing messages."
    );
  });

  it("keeps native import logs gated by the runtime debuggable flag", () => {
    const source = readNativeDriveFilePlugin();

    expect(source).toContain("ApplicationInfo.FLAG_DEBUGGABLE");
    expect(source).toContain("private boolean isDebugBuild()");
    expect(source).toContain("if (isDebugBuild())");
    expect(source).not.toContain("if (BuildConfig.DEBUG)");
  });
});
