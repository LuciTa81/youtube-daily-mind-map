import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const preCommitGroupsPath = join(process.cwd(), "docs", "checklists", "pre-commit-change-groups.md");
const rootDashArtifactPath = join(process.cwd(), "-");
const localNodeLauncherPath = join(process.cwd(), "node.cmd");

const groupOneStageFiles = [
  "AGENTS.md",
  "docs/harness.md",
  "docs/architecture.md",
  "docs/use-cases.md",
  "docs/risks.md",
  "docs/adr/TEMPLATE.md",
  "docs/adr/0001-youtube-first-product-boundary.md",
  "docs/adr/0002-android-primary-web-supporting.md",
  "docs/adr/0003-local-first-personal-data.md",
  "docs/checklists/release.md",
  "docs/checklists/pre-release-change-summary.md",
  "docs/checklists/pre-commit-change-groups.md",
  ".github/pull_request_template.md",
  ".github/workflows/quality.yml",
  "eslint.config.mjs",
  "package.json",
  "src/tests/preReleaseChecklist.test.ts",
  "src/tests/preCommitChangeGroups.test.ts",
];

const groupOneExcludedPatterns = [
  ".github/workflows/android-apk.yml",
  "android/app/src/main/**",
  "capacitor.config.ts",
  "scripts/smoke-large-takeout.mjs",
  "src/components/**",
  "src/lib/**",
  "src/tests/fixtures/**",
  "src/tests/sharedYouTubeVideo.test.ts",
  "src/tests/takeoutFixtureFlow.test.ts",
  "src/tests/importLoadingOverlay.test.ts",
  "src/tests/capacitorPrivacyConfig.test.ts",
];

const groupTwoWholeFiles = [
  "android/app/src/main/java/com/lucita81/youtubedailymindmap/NativeDriveFilePlugin.java",
  "src/components/import/DriveTakeoutImportPanel.tsx",
  "src/components/import/ImportSummaryCard.tsx",
  "src/components/import/ImportLoadingOverlay.tsx",
  "src/components/import/WatchHistoryImportPanel.tsx",
  "src/lib/drive/googlePicker.ts",
  "src/lib/import/parseTakeout.ts",
  "src/lib/native/nativeDriveFile.ts",
  "scripts/smoke-large-takeout.mjs",
  "src/tests/fixtures/takeoutFixtures.ts",
  "src/tests/importLoadingOverlay.test.ts",
  "src/tests/importResultSummary.test.ts",
  "src/tests/largeTakeoutSmokeScript.test.ts",
  "src/tests/nativeDriveFile.test.ts",
  "src/tests/nativeDriveFilePluginSource.test.ts",
  "src/tests/parseTakeout.test.ts",
  "src/tests/takeoutFixtureFlow.test.ts",
  "src/tests/watchHistoryImportPanelError.test.ts",
];

const groupTwoMixedFiles = [
  "src/types/watch.ts",
  "src/components/layout/AppShell.tsx",
  "src/components/layout/LeftPanel.tsx",
  "src/components/layout/HomeDashboard.tsx",
];

const groupTwoMixedHunkIncludes = [
  "the `WatchHistoryImportSummary` type block",
  "`buildImportSummary(...)`",
  "`latestImportSummary` state",
  "returning `Promise<WatchHistoryImportSummary>`",
  "passing `latestImportSummary` into `LeftPanel` and `HomeDashboard`",
  "the `youtubeMindMap:goHome` listener only as native-import return-home handling",
  "`latestImportSummary` prop and pass-through into `WatchHistoryImportPanel`",
  "`ImportSummaryCard` import",
  "rendering `<ImportSummaryCard summary={latestImportSummary} />`",
];

const groupTwoMixedHunkExcludes = [
  "`VideoMemoryTag`, `memoryTag`, `memoryNote`, and `memoryUpdatedAt`",
  "`getDateKeyForItem`, `addNativeShareIntentListener`, `consumePendingNativeShareIntent`",
  "`saveSharedYouTubeVideo`, `applyVideoMemoryDraft`, `SharedMemoryPrompt`",
  "shared-memory state/effects/handlers",
  "`handleVideoMemorySave`, `onVideoMemorySave`, and settings bottom-padding hunks",
  "`getVideoMemorySummary`, video memory badges, `markedMemoryItems`",
  "the `오늘 남긴 영상` section",
];

const groupTwoExcludedPatterns = [
  "android/app/src/main/AndroidManifest.xml",
  "android/app/src/main/java/com/lucita81/youtubedailymindmap/MainActivity.java",
  "android/app/src/main/java/com/lucita81/youtubedailymindmap/NativeShareIntentPlugin.java",
  "capacitor.config.ts",
  "src/components/share/**",
  "src/lib/native/nativeShareIntent.ts",
  "src/lib/share/**",
  "src/lib/review/**",
  "src/components/review/**",
  "src/components/timeline/**",
  "src/components/mindmap/NodeDetailRenderer.tsx",
  "src/components/layout/LeftPanel.tsx",
  "src/tests/sharedYouTubeVideo.test.ts",
  "src/tests/shareGuideCopy.test.ts",
  "src/tests/videoMemory.test.ts",
  "src/tests/buildDailyReview.test.ts",
  "src/tests/buildWeeklyReport.test.ts",
  "src/tests/mobileSettingsLayout.test.ts",
  "src/tests/capacitorPrivacyConfig.test.ts",
];

const groupThreeWholeFiles = [
  "android/app/src/main/AndroidManifest.xml",
  "android/app/src/main/java/com/lucita81/youtubedailymindmap/MainActivity.java",
  "android/app/src/main/java/com/lucita81/youtubedailymindmap/NativeShareIntentPlugin.java",
  "src/components/share/SharedMemoryPrompt.tsx",
  "src/lib/native/nativeShareIntent.ts",
  "src/lib/share/sharedYouTubeVideo.ts",
  "src/lib/share/videoMemory.ts",
  "src/tests/sharedYouTubeVideo.test.ts",
  "src/tests/shareGuideCopy.test.ts",
  "src/tests/videoMemory.test.ts",
];

const groupThreeMixedFiles = [
  "src/types/watch.ts",
  "src/components/layout/AppShell.tsx",
];

const groupThreeMixedHunkIncludes = [
  "`VideoMemoryTag`",
  "`memoryTag`, `memoryNote`, and `memoryUpdatedAt` on `WatchItem`",
  "`getDateKeyForItem` import for routing a shared video into the selected day",
  "`addNativeShareIntentListener` and `consumePendingNativeShareIntent` imports",
  "`saveSharedYouTubeVideo`, `applyVideoMemoryDraft`, and `SharedMemoryPrompt` imports",
  "shared-memory state, pending native-share consumption, native-share listener",
  "same-day duplicate handling",
  "rendering `<SharedMemoryPrompt ... />`",
];

const groupThreeExcludedPatterns = [
  "src/components/layout/DetailPanel.tsx",
  "src/components/mindmap/NodeDetailRenderer.tsx",
  "src/components/layout/HomeDashboard.tsx",
  "src/components/review/**",
  "src/components/timeline/**",
  "src/lib/review/**",
  "src/tests/buildDailyReview.test.ts",
  "src/tests/buildWeeklyReport.test.ts",
  "src/tests/mobileSettingsLayout.test.ts",
  "capacitor.config.ts",
  "src/tests/capacitorPrivacyConfig.test.ts",
];

const groupFourWholeFiles = [
  "src/components/layout/DetailPanel.tsx",
  "src/components/layout/HomeDashboard.tsx",
  "src/components/mindmap/NodeDetailRenderer.tsx",
  "src/components/review/WeeklyReportPanel.tsx",
  "src/components/timeline/WatchTimeline.tsx",
  "src/lib/review/buildDailyReview.ts",
  "src/lib/review/buildWeeklyReport.ts",
  "src/lib/review/memorableItems.ts",
  "src/tests/buildDailyReview.test.ts",
  "src/tests/buildWeeklyReport.test.ts",
];

const groupFourHunkIncludes = [
  "passing `onVideoMemorySave={dataViewMode === \"saved\" ? handleVideoMemorySave : undefined}` into `DetailPanel`",
  "Keep `buildDailyReview`, `buildWeeklyReport`, and `memorableItems` as pure domain/report logic",
  "Do not display watch duration unless true duration data exists",
  "confirm only the `onVideoMemorySave` prop hunk is staged",
  "daily review, timeline, and weekly report",
];

const groupFourExcludedPatterns = [
  "src/components/layout/AppShell.tsx` settings safe-area bottom-padding hunks",
  "src/tests/mobileSettingsLayout.test.ts",
  "capacitor.config.ts",
  "src/tests/capacitorPrivacyConfig.test.ts",
  "docs/checklists/pre-commit-change-groups.md",
  "src/tests/preCommitChangeGroups.test.ts",
];

const groupFiveHunkIncludes = [
  "`defaultBottomPaddingClass`",
  "`settingsBottomPaddingClass`",
  "`mainContentClassName`",
  'replacing the static `<main className="flex-1 px-4 py-4 pb-24 md:px-6">`',
  "confirm only the settings bottom-padding hunk is staged",
];

const groupFiveExcludedPatterns = [
  "src/components/layout/DetailPanel.tsx",
  "src/components/layout/HomeDashboard.tsx",
  "src/components/mindmap/NodeDetailRenderer.tsx",
  "src/components/review/WeeklyReportPanel.tsx",
  "src/components/timeline/WatchTimeline.tsx",
  "src/lib/review/**",
  "src/tests/buildDailyReview.test.ts",
  "src/tests/buildWeeklyReport.test.ts",
  "capacitor.config.ts",
  "src/tests/capacitorPrivacyConfig.test.ts",
];

const groupSixWholeFiles = [
  "capacitor.config.ts",
  "src/tests/capacitorPrivacyConfig.test.ts",
];

const currentWorkingTreeChangedFiles = [
  "android/app/src/main/java/com/lucita81/youtubedailymindmap/NativeShareIntentPlugin.java",
  "android/app/src/main/res/values/styles.xml",
  "android/app/src/main/res/anim/quick_share_noop.xml",
  "docs/adr/0006-quick-share-save-mode.md",
  "docs/risks.md",
  "docs/use-cases.md",
  "src/components/layout/AppShell.tsx",
  "src/components/layout/HomeDashboard.tsx",
  "src/components/layout/LeftPanel.tsx",
  "src/lib/native/nativeShareIntent.ts",
  "src/lib/review/buildDailyReview.ts",
  "src/lib/review/memorableItems.ts",
  "src/lib/share/quickShareSave.ts",
  "src/lib/storage/userSettingsRepository.ts",
  "src/tests/androidQuickShareTransitionTheme.test.ts",
  "src/tests/buildDailyReview.test.ts",
  "src/tests/quickShareCompletion.test.ts",
  "src/tests/quickShareSavePolicy.test.ts",
  "src/tests/quickShareSettingsUx.test.ts",
  "src/tests/sharedMemoryHomeUx.test.ts",
  "src/tests/userSettingsRepository.test.ts",
  "docs/checklists/pre-commit-change-groups.md",
  "src/tests/preCommitChangeGroups.test.ts",
];

const currentGroupEStageFiles = [
  "docs/adr/0006-quick-share-save-mode.md",
  "docs/risks.md",
  "docs/use-cases.md",
  "android/app/src/main/java/com/lucita81/youtubedailymindmap/NativeShareIntentPlugin.java",
  "android/app/src/main/res/values/styles.xml",
  "android/app/src/main/res/anim/quick_share_noop.xml",
  "src/lib/native/nativeShareIntent.ts",
  "src/lib/share/quickShareSave.ts",
  "src/lib/storage/userSettingsRepository.ts",
  "src/tests/androidQuickShareTransitionTheme.test.ts",
  "src/tests/quickShareCompletion.test.ts",
  "src/tests/quickShareSavePolicy.test.ts",
  "src/tests/quickShareSettingsUx.test.ts",
  "src/tests/userSettingsRepository.test.ts",
];

const currentGroupFStageFiles = [
  "src/components/layout/HomeDashboard.tsx",
  "src/lib/review/buildDailyReview.ts",
  "src/lib/review/memorableItems.ts",
  "src/tests/buildDailyReview.test.ts",
  "src/tests/sharedMemoryHomeUx.test.ts",
];

const currentGroupGStageFiles = [
  "docs/checklists/pre-commit-change-groups.md",
  "src/tests/preCommitChangeGroups.test.ts",
];

function readPreCommitGroups(): string {
  return readFileSync(preCommitGroupsPath, "utf8");
}

describe("pre-commit change groups checklist", () => {
  it("keeps the required harness sections visible", () => {
    const checklist = readPreCommitGroups();

    expect(checklist).toContain("## Product Boundary");
    expect(checklist).toContain("## Commit Groups");
    expect(checklist).toContain("### Group 1 Stage Candidate Review - 2026-06-03");
    expect(checklist).toContain("## Resolved Local Cleanup");
    expect(checklist).toContain("## Needs Decision Before Commit");
    expect(checklist).toContain("## Do Not Commit");
    expect(checklist).toContain("## Verification Before Commit");
    expect(checklist).toContain("## Suggested Commit Order");
  });

  it("keeps the current narrow working-tree audit visible", () => {
    const checklist = readPreCommitGroups();

    expect(checklist).toContain("## Current Working Tree Audit - 2026-06-03");
    expect(checklist).toContain(
      "Snapshot source: `git status --short`, `git diff --name-only`, and `git ls-files --others --exclude-standard`"
    );
    expect(checklist).toContain("ADR: required and added for optional quick share save mode.");
    expect(checklist).toContain(
      "YouTube-first shared-video save, local settings, Android native completion, quick-share transition polish"
    );
    expect(checklist).toContain("It does not add broad Drive search");
    expect(checklist).toContain("runtime AI calls");
    expect(checklist).toContain("overlay permission");

    for (const file of currentWorkingTreeChangedFiles) {
      expect(checklist).toContain(`- \`${file}\``);
    }
  });

  it("keeps Current Group E staged around the quick share save loop only", () => {
    const checklist = readPreCommitGroups();

    expect(checklist).toContain("### Current Group E - Quick Share Save Loop");
    expect(checklist).toContain("opt-in quick-save setting");
    expect(checklist).toContain("native Toast/return behavior");
    expect(checklist).toContain("launch-transition mitigation");

    for (const file of currentGroupEStageFiles) {
      expect(checklist).toContain(`- \`${file}\``);
    }

    expect(checklist).toContain(
      "npm run test -- src/tests/quickShareCompletion.test.ts src/tests/quickShareSavePolicy.test.ts src/tests/quickShareSettingsUx.test.ts src/tests/userSettingsRepository.test.ts src/tests/androidQuickShareTransitionTheme.test.ts src/tests/preCommitChangeGroups.test.ts"
    );
    expect(checklist).toContain("npm run verify");
    expect(checklist).toContain("npx cap sync android");
    expect(checklist).toContain("android/gradlew assembleDebug");
    expect(checklist).toContain("Real-device smoke: clean or update install");
    expect(checklist).toContain("Do not stage shared-memory Home review display work in Current Group E.");
    expect(checklist).toContain("overlay permission");
    expect(checklist).toContain("Do not claim watch duration.");
    expect(checklist).toContain("feat(android): add opt-in quick share save mode");
  });

  it("keeps Current Group E mixed AppShell and LeftPanel boundaries explicit", () => {
    const checklist = readPreCommitGroups();

    expect(checklist).toContain("Mixed files that require partial/hunk staging for Current Group E:");
    expect(checklist).toContain("Include: user-settings load/save state for `quickShareSaveEnabled`.");
    expect(checklist).toContain("Include: pending native share consumption after user settings are ready.");
    expect(checklist).toContain("Include: `shouldCompleteQuickShare(...)`, `getQuickShareCompletionMessage(...)`, and `completeNativeQuickShare(...)` usage.");
    expect(checklist).toContain("Include: skipping the memory prompt only after the shared video persisted successfully.");
    expect(checklist).toContain("Exclude: Home review card layout, marked-memory review sections, and daily-review/report display changes.");
    expect(checklist).toContain("Include: the opt-in quick share save setting and its explanatory copy.");
  });

  it("keeps Current Group F staged around shared-memory review surface only", () => {
    const checklist = readPreCommitGroups();

    expect(checklist).toContain("### Current Group F - Shared Memory Review Surface");
    expect(checklist).toContain("daily-review value surface");
    expect(checklist).toContain("directly saved/shared videos visible in Home review");

    for (const file of currentGroupFStageFiles) {
      expect(checklist).toContain(`- \`${file}\``);
    }

    expect(checklist).toContain("Mixed files that require partial/hunk staging for Current Group F:");
    expect(checklist).toContain("Include: passing saved/shared-memory-derived review data into Home surfaces if that hunk is present.");
    expect(checklist).toContain("Exclude: quick-share native completion, local settings, and Android bridge hunks");
    expect(checklist).toContain("Do not stage Android native files in Current Group F.");
    expect(checklist).toContain("Do not stage quick-share setting/storage/native-completion files in Current Group F.");
    expect(checklist).toContain("npm run test -- src/tests/buildDailyReview.test.ts src/tests/sharedMemoryHomeUx.test.ts src/tests/preCommitChangeGroups.test.ts");
    expect(checklist).toContain("feat: surface shared memories in daily review");
  });

  it("keeps Current Group G as a planning-only checklist refresh", () => {
    const checklist = readPreCommitGroups();

    expect(checklist).toContain("### Current Group G - Commit Grouping Checklist Refresh");
    expect(checklist).toContain("planning document and its guardrail tests");

    for (const file of currentGroupGStageFiles) {
      expect(checklist).toContain(`- \`${file}\``);
    }

    expect(checklist).toContain("npm run test -- src/tests/preCommitChangeGroups.test.ts");
    expect(checklist).toContain("Do not stage product runtime code in Current Group G.");
    expect(checklist).toContain("1. Current Group G - Commit Grouping Checklist Refresh.");
    expect(checklist).toContain("2. Current Group E - Quick Share Save Loop.");
    expect(checklist).toContain("3. Current Group F - Shared Memory Review Surface.");
  });

  it("keeps the current working tree grouped into reviewable commit candidates", () => {
    const checklist = readPreCommitGroups();

    expect(checklist).toContain("Group 1 - Agent Harness, Docs, And CI");
    expect(checklist).toContain("AGENTS.md");
    expect(checklist).toContain(".github/workflows/quality.yml");
    expect(checklist).toContain("docs/checklists/pre-release-change-summary.md");
    expect(checklist).toContain("src/tests/preReleaseChecklist.test.ts");
    expect(checklist).toContain("Decision: stage only the harness, docs, CI, and checklist-test files below");
    expect(checklist).toContain("Do not run `git add -A` for this group");
    expect(checklist).toContain("Include in Group 1 staging:");
    expect(checklist).toContain("docs/adr/0003-local-first-personal-data.md");
    expect(checklist).toContain("src/tests/preCommitChangeGroups.test.ts");
    expect(checklist).toContain("Exclude from Group 1 staging:");
    expect(checklist).toContain(".github/workflows/android-apk.yml`: tracked and unchanged");
    expect(checklist).toContain("android/app/src/main/**");
    expect(checklist).toContain("src/tests/takeoutFixtureFlow.test.ts");
    expect(checklist).toContain("Suggested manual staging command");
    expect(checklist).toContain("git add -- AGENTS.md");
    expect(checklist).toContain("package.json` is included only because its current diff adds harness scripts");
    expect(checklist).toContain("### Group 1 Commit Message Draft");
    expect(checklist).toContain("chore: add agent harness and quality gates");
    expect(checklist).toContain("No Android native files should be staged in this commit");
    expect(checklist).toContain("No product UI files should be staged in this commit");
    expect(checklist).toContain("package.json` should only contain harness-script changes");
    expect(checklist).toContain("git diff --cached --check` should pass before committing this group");

    expect(checklist).toContain("Group 2 - Takeout And Drive Import Hardening");
    expect(checklist).toContain("android/app/src/main/java/com/lucita81/youtubedailymindmap/NativeDriveFilePlugin.java");
    expect(checklist).toContain("src/lib/import/parseTakeout.ts");
    expect(checklist).toContain("src/lib/native/nativeDriveFile.ts");
    expect(checklist).toContain("src/tests/takeoutFixtureFlow.test.ts");
    expect(checklist).toContain("Candidate whole files:");
    expect(checklist).toContain("Mixed files that require partial/hunk staging:");
    expect(checklist).toContain("Group 2 Stage Candidate Review - 2026-06-03");
    expect(checklist).toContain("Do not whole-file stage `AppShell.tsx`, `HomeDashboard.tsx`, or `watch.ts`");
    expect(checklist).toContain("Whole-file stage `LeftPanel.tsx` only if its diff is still limited");
    expect(checklist).toContain("Keep Drive access user-selected");

    expect(checklist).toContain("Group 3 - Android YouTube Share Save Loop");
    expect(checklist).toContain("android/app/src/main/java/com/lucita81/youtubedailymindmap/NativeShareIntentPlugin.java");
    expect(checklist).toContain("src/lib/native/nativeShareIntent.ts");
    expect(checklist).toContain("src/lib/share/");
    expect(checklist).toContain("Group 3 Stage Candidate Review - 2026-06-03");
    expect(checklist).toContain("Do not stage daily/weekly review display surfaces for this group");

    expect(checklist).toContain("Group 4 - Daily And Weekly Review Surfaces");
    expect(checklist).toContain("src/lib/review/buildDailyReview.ts");
    expect(checklist).toContain("src/lib/review/buildWeeklyReport.ts");
    expect(checklist).toContain("src/lib/review/memorableItems.ts");
    expect(checklist).toContain("Group 4 Stage Candidate Review - 2026-06-03");

    expect(checklist).toContain("Group 5 - Mobile, Foldable, And Loading Polish");
    expect(checklist).toContain("src/components/import/ImportLoadingOverlay.tsx");
    expect(checklist).toContain("Group 5 Stage Candidate Review - 2026-06-03");

    expect(checklist).toContain("Group 6 - Android And Capacitor Packaging Guardrails");
    expect(checklist).toContain("capacitor.config.ts");
    expect(checklist).toContain("Group 6 Stage Candidate Review - 2026-06-03");
  });

  it("keeps the exact Group 1 stage include and exclude sets visible", () => {
    const checklist = readPreCommitGroups();

    for (const file of groupOneStageFiles) {
      expect(checklist).toContain(`- \`${file}\``);
    }

    for (const excluded of groupOneExcludedPatterns) {
      expect(checklist).toContain(excluded);
    }
  });

  it("keeps the manual Group 1 staging command aligned with the include list", () => {
    const checklist = readPreCommitGroups();
    const commandStart = checklist.indexOf("git add -- ");

    expect(commandStart).toBeGreaterThanOrEqual(0);

    const command = checklist.slice(commandStart, checklist.indexOf("```", commandStart));

    for (const file of groupOneStageFiles) {
      expect(command).toContain(file);
    }
  });

  it("keeps the exact Group 2 whole-file include set visible", () => {
    const checklist = readPreCommitGroups();

    for (const file of groupTwoWholeFiles) {
      expect(checklist).toContain(`- \`${file}\``);
    }
  });

  it("marks mixed Group 2 files for partial staging only", () => {
    const checklist = readPreCommitGroups();

    for (const file of groupTwoMixedFiles) {
      expect(checklist).toContain(`- \`${file}\``);
    }

    expect(checklist).toContain("include only `WatchHistoryImportSummary`");
    expect(checklist).toContain("include only import-summary application flow");
    expect(checklist).toContain("include only the import-summary pass-through hunk");
    expect(checklist).toContain("include only `latestImportSummary` and `ImportSummaryCard` rendering");
  });

  it("keeps the Group 2 mixed-file hunk plan specific enough for partial staging", () => {
    const checklist = readPreCommitGroups();

    expect(checklist).toContain("Group 2 mixed hunk plan:");

    for (const include of groupTwoMixedHunkIncludes) {
      expect(checklist).toContain(include);
    }

    for (const excluded of groupTwoMixedHunkExcludes) {
      expect(checklist).toContain(excluded);
    }

    expect(checklist).toContain("Do not use `git add` on mixed files");
    expect(checklist).toContain("stage it manually with a temporary patch");
    expect(checklist).toContain(
      "git diff --cached -- src/types/watch.ts src/components/layout/AppShell.tsx src/components/layout/LeftPanel.tsx src/components/layout/HomeDashboard.tsx"
    );
  });

  it("keeps Group 2 exclusions and native verification visible", () => {
    const checklist = readPreCommitGroups();

    for (const excluded of groupTwoExcludedPatterns) {
      expect(checklist).toContain(excluded);
    }

    expect(checklist).toContain("npx cap sync android");
    expect(checklist).toContain("android/gradlew assembleDebug");
    expect(checklist).toContain("invalid ZIP rejection");
    expect(checklist).toContain("valid fixture completion");
    expect(checklist).toContain("duplicate fixture import");
    expect(checklist).toContain("large-file progress visibility");
    expect(checklist).toContain("do not introduce broad Drive search or raw Takeout server upload");
  });

  it("keeps the exact Group 3 whole-file include set visible", () => {
    const checklist = readPreCommitGroups();

    for (const file of groupThreeWholeFiles) {
      expect(checklist).toContain(`- \`${file}\``);
    }
  });

  it("keeps the Group 3 mixed-file hunk plan specific enough for partial staging", () => {
    const checklist = readPreCommitGroups();

    expect(checklist).toContain("Mixed files that require partial/hunk staging:");

    for (const file of groupThreeMixedFiles) {
      expect(checklist).toContain(`- \`${file}\``);
    }

    for (const include of groupThreeMixedHunkIncludes) {
      expect(checklist).toContain(include);
    }

    expect(checklist).toContain("Exclude: passing `onVideoMemorySave` into `DetailPanel`");
    expect(checklist).toContain("Exclude: settings safe-area bottom-padding hunks");
  });

  it("keeps Group 3 exclusions and native share verification visible", () => {
    const checklist = readPreCommitGroups();

    for (const excluded of groupThreeExcludedPatterns) {
      expect(checklist).toContain(excluded);
    }

    expect(checklist).toContain("YouTube app share chooser visibility");
    expect(checklist).toContain("cold-start pending share");
    expect(checklist).toContain("warm-app `onNewIntent`");
    expect(checklist).toContain("same-day duplicate handling");
    expect(checklist).toContain("non-YouTube share rejection");
    expect(checklist).toContain("shared-memory tag/note persistence");
    expect(checklist).toContain("do not upload shared URLs, notes, or video titles to a server");
    expect(checklist).toContain("Do not claim watch duration");
  });

  it("keeps the exact Group 4 review-surface include set visible", () => {
    const checklist = readPreCommitGroups();

    for (const file of groupFourWholeFiles) {
      expect(checklist).toContain(`- \`${file}\``);
    }

    expect(checklist).toContain("Mixed files that require partial/hunk staging:");
    expect(checklist).toContain("src/components/layout/AppShell.tsx");
  });

  it("keeps the Group 4 partial-staging boundary specific", () => {
    const checklist = readPreCommitGroups();

    for (const include of groupFourHunkIncludes) {
      expect(checklist).toContain(include);
    }

    for (const excluded of groupFourExcludedPatterns) {
      expect(checklist).toContain(excluded);
    }

    expect(checklist).toContain("Do not add AI summaries, automatic AI calls");
    expect(checklist).toContain("npx cap sync android");
    expect(checklist).toContain("android/gradlew assembleDebug");
  });

  it("keeps the Group 5 mobile-layout hunk plan specific enough for partial staging", () => {
    const checklist = readPreCommitGroups();

    expect(checklist).toContain("Current whole-file candidates:");
    expect(checklist).toContain("- `src/tests/mobileSettingsLayout.test.ts`");

    for (const include of groupFiveHunkIncludes) {
      expect(checklist).toContain(include);
    }

    for (const excluded of groupFiveExcludedPatterns) {
      expect(checklist).toContain(excluded);
    }

    expect(checklist).toContain("fixed bottom nav");
  });

  it("keeps the Group 6 Capacitor privacy guardrail plan specific", () => {
    const checklist = readPreCommitGroups();

    for (const file of groupSixWholeFiles) {
      expect(checklist).toContain(`- \`${file}\``);
    }

    expect(checklist).toContain('loggingBehavior: "none"');
    expect(checklist).toContain("native bridge logging disabled");
    expect(checklist).toContain("Do not add new native plugins");
    expect(checklist).toContain("npx cap sync android");
    expect(checklist).toContain("android/gradlew assembleDebug");
    expect(checklist).toContain("android/gradlew assembleRelease");
    expect(checklist).toContain("logcat");
  });

  it("keeps the Group 1 commit message focused on harness work", () => {
    const checklist = readPreCommitGroups();

    expect(checklist).toContain("chore: add agent harness and quality gates");
    expect(checklist).toContain("add agent instructions, architecture, use cases, risks, ADRs, and release checklists");
    expect(checklist).toContain("add CI quality workflow, ESLint flat config, and verify/typecheck scripts");
    expect(checklist).toContain("add checklist tests that keep staged groups and release guardrails visible");
    expect(checklist).not.toContain("feat: add");
  });

  it("keeps accidental or generated files out of the default commit path", () => {
    const checklist = readPreCommitGroups();

    expect(checklist).toContain("`-`: root-level ZIP-like binary fixture");
    expect(checklist).toContain("Decision: delete from the workspace and do not commit");
    expect(checklist).toContain("`node.cmd`: local Windows Node launcher");
    expect(checklist).toContain("shadow project Node resolution on Windows");
    expect(checklist).toContain("fix the shell `PATH` for that session instead of adding a root launcher");
    expect(checklist).toContain(".next/");
    expect(checklist).toContain("android/app/build/");
    expect(checklist).toContain("tsconfig.tsbuildinfo");
    expect(checklist).toContain("Local raw Takeout ZIPs or extracted Takeout folders");
  });

  it("keeps release-grade verification commands visible before commit", () => {
    const checklist = readPreCommitGroups();

    expect(checklist).toContain("npm run verify");
    expect(checklist).toContain('$env:PATH = "C:\\Program Files\\nodejs;$env:PATH"');
    expect(checklist).toContain("git diff --cached --check");
    expect(checklist).toContain("npx cap sync android");
    expect(checklist).toContain("android/gradlew assembleDebug");
    expect(checklist).toContain("android/gradlew assembleRelease");
    expect(checklist).toContain("real-device smoke test");
  });

  it("keeps product-scope and privacy stop conditions explicit", () => {
    const checklist = readPreCommitGroups();

    expect(checklist).toContain("YouTube-first");
    expect(checklist).toContain("without ADR");
    expect(checklist).toContain("broad Drive search");
    expect(checklist).toContain("server upload of raw personal records");
    expect(checklist).toContain("must not be committed under this name");
  });

  it("keeps accidental root cleanup artifacts absent from the workspace", () => {
    expect(existsSync(rootDashArtifactPath)).toBe(false);
    expect(existsSync(localNodeLauncherPath)).toBe(false);
  });
});
