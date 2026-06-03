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
    expect(checklist).toContain("## GitHub Actions APK Emulator Clean Install Smoke Result - 2026-06-03 (0d327d1)");
    expect(checklist).toContain("## GitHub Actions APK Emulator Clean Install Smoke Result - 2026-06-03 (b2b5bf8)");
    expect(checklist).toContain("## GitHub Actions APK Emulator Clean Install Smoke Result - 2026-06-03 (7ec33e2)");
    expect(checklist).toContain("## GitHub Actions APK Emulator Clean Install Smoke Result - 2026-06-03 (1768952)");
    expect(checklist).toContain("## GitHub Actions APK Emulator Clean Install Smoke Result - 2026-06-03 (205656e)");
    expect(checklist).toContain("## GitHub Actions APK Emulator Clean Install Smoke Result - 2026-06-03 (8a086cb)");
    expect(checklist).toContain("## GitHub Actions APK Emulator Clean Install Smoke Result - 2026-06-03 (bf8880a)");
    expect(checklist).toContain("## GitHub Actions APK Artifact Verification Result - 2026-06-03 (68c8ef3)");
    expect(checklist).toContain("## GitHub Actions APK Emulator Clean Install Smoke Result - 2026-06-03 (68c8ef3)");
    expect(checklist).toContain("## GitHub Actions APK Artifact Verification Result - 2026-06-03 (20b6b3c)");
    expect(checklist).toContain("## GitHub Actions APK Emulator Clean Install Smoke Result - 2026-06-03 (20b6b3c)");
    expect(checklist).toContain("## GitHub Actions APK Artifact Verification Result - 2026-06-03 (9447fe7)");
    expect(checklist).toContain("## GitHub Actions APK Emulator Clean Install Smoke Result - 2026-06-03 (9447fe7)");
    expect(checklist).toContain("## Android Real-device Large Drive Takeout Cancellation Smoke Result - 2026-06-03 (working tree)");
    expect(checklist).toContain("## Android Debug Large Drive Cancellation Cleanup UI Smoke Result - 2026-06-03 (working tree)");
    expect(checklist).toContain("## Android Release Large Drive Takeout Cancellation Smoke Result - 2026-06-03 (working tree)");
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
    expect(checklist).toContain("Build commit: `0d327d160eeb70340e09473cc9badc1e29007be9`");
    expect(checklist).toContain("Build Android APK` run `26851258504`");
    expect(checklist).toContain("artifact id `7371154328`");
    expect(checklist).toContain("Artifact ZIP downloaded from GitHub Actions; size 4,249,037 bytes");
    expect(checklist).toContain("Emulator boot completed on model `sdk_gphone64_x86_64`, Android 16, API 36, with physical size `1080x1920`");
    expect(checklist).toContain("Current focus was `com.lucita81.youtubedailymindmap/com.lucita81.youtubedailymindmap.MainActivity`");
    expect(checklist).toContain("codex-0d327d1-emulator-clean-install-launch-after-wait-pulled.png");
    expect(checklist).toContain("Home screen rendered with the header, summary cards, `가져오기` button, and bottom navigation visible");
    expect(checklist).toContain("filtered recent logcat showed no `FATAL EXCEPTION`, `AndroidRuntime`, or app death lines");
    expect(checklist).toContain("The first `uiautomator dump` returned `null root node`");
    expect(checklist).toContain("Build commit: `b2b5bf8664467669aa0ea3616949fb7bc64f2898`");
    expect(checklist).toContain("Build Android APK` run `26851950804`");
    expect(checklist).toContain("artifact id `7371417441`");
    expect(checklist).toContain("Artifact ZIP downloaded from GitHub Actions; size 4,249,039 bytes");
    expect(checklist).toContain("codex-b2b5bf8-emulator-clean-install-launch-after-wait.png");
    expect(checklist).toContain("Home screen rendered with the header, summary cards, import button, and bottom navigation visible");
    expect(checklist).toContain("codex-b2b5bf8-emulator-window.xml");
    expect(checklist).toContain("strict filtered logcat showed no `FATAL EXCEPTION`");
    expect(checklist).toContain("Force finishing activity com.lucita81.youtubedailymindmap");
    expect(checklist).toContain("`uiautomator dump` produced a limited WebView hierarchy");
    expect(checklist).toContain("Build commit: `7ec33e236f946592ea16f2da1f08e80eba2082fc`");
    expect(checklist).toContain("Build Android APK` run `26853716256`");
    expect(checklist).toContain("artifact id `7372107428`");
    expect(checklist).toContain("Artifact ZIP downloaded from GitHub Actions; size 4,249,037 bytes");
    expect(checklist).toContain("app-debug.apk`, size 4,635,774 bytes");
    expect(checklist).toContain("codex-7ec33e2-emulator-clean-install-launch-after-wait.png");
    expect(checklist).toContain("codex-7ec33e2-emulator-window.xml");
    expect(checklist).toContain("Build commit: `1768952a66c0da3d3805c83c3abbac6dd9b7a0d1`");
    expect(checklist).toContain("Build Android APK` run `26854263946`");
    expect(checklist).toContain("artifact id `7372326613`");
    expect(checklist).toContain("Artifact ZIP downloaded from GitHub Actions; size 4,249,040 bytes");
    expect(checklist).toContain("Initial screenshot showed a `System UI isn't responding` dialog");
    expect(checklist).toContain("the smoke tapped `Wait` and rechecked the app after the system UI recovered");
    expect(checklist).toContain("codex-1768952-emulator-clean-install-launch-after-systemui-wait.png");
    expect(checklist).toContain("codex-1768952-emulator-window-after-systemui-wait.xml");
    expect(checklist).toContain("The first screenshot showed a System UI ANR dialog before the app became focused");
    expect(checklist).toContain("Build commit: `205656e3f291f724fbd064042d9016c5b462fdd2`");
    expect(checklist).toContain("Build Android APK` run `26855098439`");
    expect(checklist).toContain("artifact id `7372650349`");
    expect(checklist).toContain("Artifact ZIP downloaded from GitHub Actions; size 4,249,053 bytes");
    expect(checklist).toContain("app-debug.apk`, size 4,635,786 bytes");
    expect(checklist).toContain("codex-205656e-emulator-clean-install-launch-after-wait.png");
    expect(checklist).toContain("still showed the app skeleton screen");
    expect(checklist).toContain("codex-205656e-emulator-clean-install-launch-after-extra-wait.png");
    expect(checklist).toContain("codex-205656e-emulator-window-extra.xml");
    expect(checklist).toContain("The first screenshot showed only the app skeleton screen");
    expect(checklist).toContain("Build commit: `8a086cb0238cb1e79ed4bc745409d1a11b52d9f5`");
    expect(checklist).toContain("Build Android APK` run `26856111989`");
    expect(checklist).toContain("artifact id `7373021317`");
    expect(checklist).toContain("Artifact ZIP downloaded from GitHub Actions; size 4,249,039 bytes");
    expect(checklist).toContain("a1c81e075470ae9e757200db3a279f7cad3c31b8472142a358f5c2e98914e195");
    expect(checklist).toContain("app-debug.apk`, size 4,635,766 bytes");
    expect(checklist).toContain("Installed package code path was under `/data/app/.../com.lucita81.youtubedailymindmap...`");
    expect(checklist).toContain("App process was alive after launch with pid `2943`");
    expect(checklist).toContain("codex-8a086cb-emulator-clean-install-launch-after-wait.png");
    expect(checklist).toContain("size 280,740 bytes");
    expect(checklist).toContain("codex-8a086cb-emulator-window.xml");
    expect(checklist).toContain("size 2,785 bytes");
    expect(checklist).toContain("`uiautomator dump` produced a limited WebView hierarchy");
    expect(checklist).toContain("Build commit: `bf8880a42bae8290005b0e31073647007a158f99`");
    expect(checklist).toContain("Build Android APK` run `26856656716`");
    expect(checklist).toContain("artifact id `7373230313`");
    expect(checklist).toContain("Artifact ZIP downloaded from GitHub Actions; size 4,249,046 bytes");
    expect(checklist).toContain("42af32afd547ede2a982fd6573d40687b2d256f70fffb920e3b90c51f70e98c9");
    expect(checklist).toContain("app-debug.apk`, size 4,635,790 bytes");
    expect(checklist).toContain("App cold-launched and `.MainActivity` became the resumed activity");
    expect(checklist).toContain("App process was alive after launch with pid `2801`");
    expect(checklist).toContain("codex-bf8880a-emulator-clean-install-launch-after-wait.png");
    expect(checklist).toContain("size 280,281 bytes");
    expect(checklist).toContain("codex-bf8880a-emulator-window.xml");
    expect(checklist).toContain("Build commit: `68c8ef37ae0e6d8f46afbc9857fa85edc2f36f1d`");
    expect(checklist).toContain("Build Android APK` run `26857188380`");
    expect(checklist).toContain("artifact id `7373441909`");
    expect(checklist).toContain("Artifact ZIP downloaded from GitHub Actions; size 4,249,038 bytes");
    expect(checklist).toContain("0ad23e2890fe12e8deed83f63573699203e58ad0187e87cd75b924d7de8c991b");
    expect(checklist).toContain("app-debug.apk`, size 4,635,774 bytes");
    expect(checklist).toContain("f336ec50677b4f3470699dfe58309cd32c3c5b1f29297c8ac96a1094469beafe");
    expect(checklist).toContain("`apksigner verify` passed after setting `JAVA_HOME` to the Android Studio JBR");
    expect(checklist).toContain("`aapt dump badging` found launchable activity `com.lucita81.youtubedailymindmap.MainActivity`");
    expect(checklist).toContain("`aapt dump badging` confirmed this artifact is debuggable");
    expect(checklist).toContain("Clean AVD `codex_clean_api36` was launched with `-wipe-data`");
    expect(checklist).toContain("Emulator boot completed on model `sdk_gphone64_x86_64`, Android 16, API 36, with physical size `1080x1920`");
    expect(checklist).toContain("Installed package code path was under `/data/app/.../com.lucita81.youtubedailymindmap.../base.apk`");
    expect(checklist).toContain("Installed package flags included `DEBUGGABLE`, as expected for the GitHub Actions debug artifact");
    expect(checklist).toContain("Launch output reported `Status: ok`, `LaunchState: COLD`, `TotalTime: 9001`, and `WaitTime: 9164`");
    expect(checklist).toContain("App process was alive after launch with pid `3054`");
    expect(checklist).toContain("codex-68c8ef3-emulator-clean-install-launch-after-wait.png");
    expect(checklist).toContain("size 280,243 bytes");
    expect(checklist).toContain("codex-68c8ef3-emulator-window.xml");
    expect(checklist).toContain("Build commit: `20b6b3c95cd150d09d4d2265ac6c376707b29898`");
    expect(checklist).toContain("Build Android APK` run `26857727829`");
    expect(checklist).toContain("artifact id `7373647675`");
    expect(checklist).toContain("Artifact ZIP downloaded from GitHub Actions; size 4,249,042 bytes");
    expect(checklist).toContain("e7bebb0f0f3125ffc12d16b50025ff7712afcb3e981ea5c77ff01b3416adddd8");
    expect(checklist).toContain("app-debug.apk`, size 4,635,774 bytes");
    expect(checklist).toContain("a0cdfa57f1e7aab2009289bb6e791a1890a23bb6fd8b8c615137ce457cc825c6");
    expect(checklist).toContain("`Build Android APK` completed successfully for commit `20b6b3c`");
    expect(checklist).toContain("The first emulator start attempt created an emulator crash dump and did not attach to ADB");
    expect(checklist).toContain("Clean AVD `codex_clean_api36` was relaunched with `-wipe-data`, `-no-window`, and `-gpu swiftshader_indirect`");
    expect(checklist).toContain("Launch output reported `Status: ok`, `LaunchState: COLD`, `TotalTime: 7735`, and `WaitTime: 7807`");
    expect(checklist).toContain("App process was alive after launch with pid `2731`");
    expect(checklist).toContain("codex-20b6b3c-emulator-clean-install-launch-after-wait.png");
    expect(checklist).toContain("size 279,172 bytes");
    expect(checklist).toContain("codex-20b6b3c-emulator-window.xml");
    expect(checklist).toContain("Build commit: `9447fe7a7a0a7dc5e8e9302b2d3ece867b7a1bc3`");
    expect(checklist).toContain("Build Android APK` run `26858454960`");
    expect(checklist).toContain("artifact id `7373923997`");
    expect(checklist).toContain("Artifact ZIP downloaded from GitHub Actions; size 4,249,053 bytes");
    expect(checklist).toContain("0df765e3bb7f4a19a218d3fcb5b3cc5f90130d5eb59cf993aed9f9f3d166dcb5");
    expect(checklist).toContain("app-debug.apk`, size 4,635,778 bytes");
    expect(checklist).toContain("e6a57dd46d057b98c33798ec1d1248ffc7673273fbe1084f0a56d3af88eed539");
    expect(checklist).toContain("`Build Android APK` completed successfully for commit `9447fe7`");
    expect(checklist).toContain("This verification confirms artifact download, extraction, APK signature, and package metadata only; install, launch, Drive import, YouTube share, duplicate import, deletion, and layout flows were not repeated for commit `9447fe7`");
    expect(checklist).toContain("APK clean installed on the emulator with `adb install`; install output was `Performing Streamed Install | Success`");
    expect(checklist).toContain("Launch output reported `Status: ok`, `LaunchState: COLD`, `TotalTime: 9159`, and `WaitTime: 9167`");
    expect(checklist).toContain("App process was alive after launch with pid `2043`");
    expect(checklist).toContain("codex-9447fe7-emulator-clean-install-launch-after-wait.png");
    expect(checklist).toContain("size 276,580 bytes");
    expect(checklist).toContain("valid PNG signature");
    expect(checklist).toContain("Home screen rendered with the header, summary cards, import button, date-range card, and bottom navigation visible in the emulator screenshot");
    expect(checklist).toContain("codex-9447fe7-emulator-window.xml");
    expect(checklist).toContain("Emulator detached from ADB after shutdown, and leftover Windows emulator/qemu processes from the smoke run were cleaned up");
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
    expect(checklist).toContain("GitHub Actions debug APK clean-installed and launched on an Android 16 emulator for commits `440856a`, `cbe4b9a`, `a2e2d01`, `0d327d1`, `b2b5bf8`, `7ec33e2`, `1768952`, `205656e`, `8a086cb`, `bf8880a`, `68c8ef3`, `20b6b3c`, and `9447fe7`");
    expect(checklist).toContain("GitHub Actions debug APK artifact verification passed for commits `68c8ef3`, `20b6b3c`, and `9447fe7`");
    expect(checklist).toContain("Emulator shutdown required leftover Windows process cleanup after ADB detached");
    expect(checklist).toContain("Drive import, YouTube share, duplicate import, deletion, and layout flows were not repeated there");
    expect(checklist).toContain("install and launch were repeated in the follow-up emulator smoke");
    expect(checklist).toContain("emulator boot stability should continue to be watched");
    expect(checklist).toContain("Android Drive duplicate re-import passed with the small synthetic watch-history fixture");
    expect(checklist).toContain("Android Real-device Large Drive Takeout Smoke Result - 2026-06-03 (working tree)");
    expect(checklist).toContain("cache-space precheck had enough room for the approved large Drive archive");
    expect(checklist).toContain("large-import loading UI instead of a blank or black screen");
    expect(checklist).toContain("visible `가져오기 취소` button");
    expect(checklist).toContain("about 40,100 parsed records, 0 newly added records, and about 40,100 duplicates skipped");
    expect(checklist).toContain("contained no detected URL, YouTube URL, Gmail address, watch-history path, or concrete Takeout filename pattern");
    expect(checklist).toContain("Android Real-device Large Drive Takeout Cancellation Smoke Result - 2026-06-03 (working tree)");
    expect(checklist).toContain("The cancel button was tapped during the large Drive-provider opening/import state");
    expect(checklist).toContain("The UI immediately surfaced `가져오기를 취소했습니다.`");
    expect(checklist).toContain("visible `마지막 Drive 가져오기 결과` card showing `가져오기를 취소했습니다.`");
    expect(checklist).toContain("Saved records stayed at about 40,103");
    expect(checklist).toContain("cancellation during later parsing, merging, or final record-checking phases still needs separate coverage");
    expect(checklist).toContain("Android Debug Large Drive Cancellation Cleanup UI Smoke Result - 2026-06-03 (working tree)");
    expect(checklist).toContain("rebuilt with `npm run android:debug` and installed with `adb install -r`");
    expect(checklist).toContain("Build commit: `fcfee6c49f8774c67ec44bbc316decdae60b06d6`");
    expect(checklist).toContain("The updated cleanup UI appeared with `가져오기를 취소하는 중입니다.`");
    expect(checklist).toContain("`Drive가 파일 넘기기를 정리하면 결과 화면으로 돌아갑니다.`");
    expect(checklist).toContain("`취소 요청됨 · 정리 중입니다.`");
    expect(checklist).toContain("`취소 정리 상태`");
    expect(checklist).toContain("After cancellation, the repeated cancel button was no longer shown");
    expect(checklist).toContain("Drive-provider handoff continued for about three minutes");
    expect(checklist).toContain("including `Drive 정리 중` detail text");
    expect(checklist).toContain("Filtered native/share logcat for `NativeDriveFile`, `NativeShareIntent`, `NativeShareIntentPlugin`, and `ShareIntent` produced 6 lines");
    expect(checklist).toContain("no detected URL, YouTube URL, Gmail address, watch-history path, or concrete Takeout filename pattern");
    expect(checklist).toContain("visible debug and release cancellation cleanup UI results without adding records");
    expect(checklist).toContain("Android Release Large Drive Takeout Cancellation Smoke Result - 2026-06-03 (working tree)");
    expect(checklist).toContain("The release APK was zipaligned and signed locally for smoke");
    expect(checklist).toContain("with no debuggable marker");
    expect(checklist).toContain("with no `DEBUGGABLE` flag");
    expect(checklist).toContain("The release cleanup UI appeared with `가져오기를 취소하는 중입니다.`");
    expect(checklist).toContain("`Drive가 파일 넘기기를 정리하면 결과 화면으로 돌아갑니다.`");
    expect(checklist).toContain("The release cleanup UI also showed `대용량 Drive 파일은 취소 후에도 정리에 시간이 필요할 수 있습니다.");
    expect(checklist).toContain("After cancellation, the repeated cancel button was no longer shown in the release APK");
    expect(checklist).toContain("The release app stayed responsive and did not black-screen while the provider handoff continued for about two minutes");
    expect(checklist).toContain("The release cleanup progress remained visible during the wait, including `Drive 정리 중` detail text");
    expect(checklist).toContain("confirming the cancelled release large import did not add records");
    expect(checklist).toContain("Filtered release logcat for `NativeDriveFile`, `NativeShareIntent`, `NativeShareIntentPlugin`, and `ShareIntent` produced no output");
    expect(checklist).toContain("visible debug and release cancellation cleanup UI results without adding records");
    expect(checklist).toContain("large Drive cancellation visibility passed on the Samsung SM-F966N");
    expect(checklist).toContain("large-import coverage still needs a standard non-foldable device");
    expect(checklist).toContain("localized Korean watch-history candidate");
    expect(checklist).toContain("exercised Android full Drive copy, parsing, loading UI, and completion on the Samsung foldable");
    expect(checklist).toContain("Release APK native import logcat silence, invalid ZIP rejection visibility");
    expect(checklist).toContain("valid fixture completion, duplicate-summary visibility, YouTube share behavior, debug/release cancellation cleanup UI, and large Drive cancellation visibility passed");
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
