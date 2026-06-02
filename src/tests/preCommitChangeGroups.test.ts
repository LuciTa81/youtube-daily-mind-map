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

    expect(checklist).toContain("Group 3 - Android YouTube Share Save Loop");
    expect(checklist).toContain("android/app/src/main/java/com/lucita81/youtubedailymindmap/NativeShareIntentPlugin.java");
    expect(checklist).toContain("src/lib/native/nativeShareIntent.ts");
    expect(checklist).toContain("src/lib/share/");

    expect(checklist).toContain("Group 4 - Daily And Weekly Review Surfaces");
    expect(checklist).toContain("src/lib/review/buildDailyReview.ts");
    expect(checklist).toContain("src/lib/review/buildWeeklyReport.ts");
    expect(checklist).toContain("src/lib/review/memorableItems.ts");

    expect(checklist).toContain("Group 5 - Mobile, Foldable, And Loading Polish");
    expect(checklist).toContain("src/components/import/ImportLoadingOverlay.tsx");

    expect(checklist).toContain("Group 6 - Android And Capacitor Packaging Guardrails");
    expect(checklist).toContain("capacitor.config.ts");
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
