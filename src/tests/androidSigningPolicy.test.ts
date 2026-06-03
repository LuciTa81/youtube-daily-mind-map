import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const signingAdrPath = join(process.cwd(), "docs", "adr", "0004-ci-debug-apk-smoke-signing.md");
const releaseChecklistPath = join(process.cwd(), "docs", "checklists", "release.md");
const androidSmokeChecklistPath = join(process.cwd(), "docs", "checklists", "android-smoke-test.md");
const androidBuildGradlePath = join(process.cwd(), "android", "app", "build.gradle");
const androidApkWorkflowPath = join(process.cwd(), ".github", "workflows", "android-apk.yml");
const gitignorePath = join(process.cwd(), ".gitignore");

function readFile(path: string): string {
  return readFileSync(path, "utf8");
}

describe("Android APK signing policy", () => {
  it("records the CI debug APK update-install signing decision in an ADR", () => {
    const adr = readFile(signingAdrPath);

    expect(adr).toContain("ADR 0004: CI Debug APK Smoke Signing");
    expect(adr).toContain("Accepted");
    expect(adr).toContain("INSTALL_FAILED_UPDATE_INCOMPATIBLE");
    expect(adr).toContain("Android update installs require");
    expect(adr).toContain("Use separate signing lanes");
    expect(adr).toContain("dedicated smoke debug signing certificate");
    expect(adr).toContain("SMOKE_DEBUG_KEYSTORE_FILE");
    expect(adr).toContain("SMOKE_DEBUG_KEYSTORE_PASSWORD");
    expect(adr).toContain("SMOKE_DEBUG_KEY_ALIAS");
    expect(adr).toContain("SMOKE_DEBUG_KEY_PASSWORD");
    expect(adr).toContain("SMOKE_DEBUG_KEYSTORE_BASE64");
    expect(adr).toContain("android/app/smoke-debug.keystore");
    expect(adr).toContain("clean-install debug artifacts with the runner debug signing key");
    expect(adr).toContain("Partial smoke signing configuration fails the Gradle build");
    expect(adr).toContain("must not be committed to the repository");
    expect(adr).toContain("GitHub Actions secrets");
    expect(adr).toContain("outside the repository for local smoke builds");
    expect(adr).toContain("must not be used for Play Store release");
    expect(adr).toContain("CI debug artifacts must be treated as clean-install artifacts");
    expect(adr).toContain("Do not uninstall the existing app or clear local data unless the user explicitly approves");
  });

  it("keeps release checklist signing lanes and update-install safety explicit", () => {
    const releaseChecklist = readFile(releaseChecklistPath);

    expect(releaseChecklist).toContain("## Android Signing And Update Install");
    expect(releaseChecklist).toContain("The APK signing lane is known");
    expect(releaseChecklist).toContain("CI debug artifacts are treated as clean-install artifacts");
    expect(releaseChecklist).toContain("same dedicated smoke debug certificate as the local smoke build");
    expect(releaseChecklist).toContain("Smoke debug signing material is stored outside the repository");
    expect(releaseChecklist).toContain("GitHub Actions secrets");
    expect(releaseChecklist).toContain("SMOKE_DEBUG_KEYSTORE_FILE");
    expect(releaseChecklist).toContain("SMOKE_DEBUG_KEYSTORE_PASSWORD");
    expect(releaseChecklist).toContain("SMOKE_DEBUG_KEY_ALIAS");
    expect(releaseChecklist).toContain("SMOKE_DEBUG_KEY_PASSWORD");
    expect(releaseChecklist).toContain("SMOKE_DEBUG_KEYSTORE_BASE64");
    expect(releaseChecklist).toContain("android/app/smoke-debug.keystore");
    expect(releaseChecklist).toContain("GitHub Actions debug artifacts are clean-install only");
    expect(releaseChecklist).toContain("Do not commit keystores, passwords, signing output, APKs, or `.jks`/`.keystore` files");
    expect(releaseChecklist).toContain("Play Store candidates use the release or upload signing path");
    expect(releaseChecklist).toContain("`adb install -r` succeeds over an existing install");
    expect(releaseChecklist).toContain("`INSTALL_FAILED_UPDATE_INCOMPATIBLE`");
    expect(releaseChecklist).toContain("do not uninstall or clear local data without explicit user approval");
  });

  it("keeps Android smoke checklist honest about CI artifacts and update installs", () => {
    const androidSmokeChecklist = readFile(androidSmokeChecklistPath);

    expect(androidSmokeChecklist).toContain("The signing lane is known");
    expect(androidSmokeChecklist).toContain("CI debug artifact");
    expect(androidSmokeChecklist).toContain("local smoke debug artifact");
    expect(androidSmokeChecklist).toContain("Play Store candidate");
    expect(androidSmokeChecklist).toContain("If update-install behavior matters");
    expect(androidSmokeChecklist).toContain("same certificate as the already installed app");
    expect(androidSmokeChecklist).toContain("CI debug artifacts are treated as clean-install artifacts");
    expect(androidSmokeChecklist).toContain("dedicated smoke debug signing certificate");
    expect(androidSmokeChecklist).toContain("SMOKE_DEBUG_KEYSTORE_FILE");
    expect(androidSmokeChecklist).toContain("SMOKE_DEBUG_KEYSTORE_PASSWORD");
    expect(androidSmokeChecklist).toContain("SMOKE_DEBUG_KEY_ALIAS");
    expect(androidSmokeChecklist).toContain("SMOKE_DEBUG_KEY_PASSWORD");
    expect(androidSmokeChecklist).toContain("SMOKE_DEBUG_KEYSTORE_BASE64");
    expect(androidSmokeChecklist).toContain("not used to prove update-install behavior");
    expect(androidSmokeChecklist).toContain("Update install passed with `adb install -r`");
    expect(androidSmokeChecklist).toContain("INSTALL_FAILED_UPDATE_INCOMPATIBLE");
    expect(androidSmokeChecklist).toContain("no uninstall or clear-data step was run without explicit approval");
  });

  it("configures Gradle to use smoke debug signing only when the full environment is present", () => {
    const buildGradle = readFile(androidBuildGradlePath);

    expect(buildGradle).toContain("SMOKE_DEBUG_KEYSTORE_FILE");
    expect(buildGradle).toContain("SMOKE_DEBUG_KEYSTORE_PASSWORD");
    expect(buildGradle).toContain("SMOKE_DEBUG_KEY_ALIAS");
    expect(buildGradle).toContain("SMOKE_DEBUG_KEY_PASSWORD");
    expect(buildGradle).toContain("hasSmokeDebugSigning");
    expect(buildGradle).toContain("signingConfigs");
    expect(buildGradle).toContain("smokeDebug");
    expect(buildGradle).toContain("buildTypes");
    expect(buildGradle).toContain("debug");
    expect(buildGradle).toContain("signingConfig signingConfigs.smokeDebug");
    expect(buildGradle).toContain("GradleException");
    expect(buildGradle).toContain("Smoke debug signing is partially configured");
  });

  it("restores, uses, and removes the CI smoke debug keystore without requiring secrets for clean installs", () => {
    const workflow = readFile(androidApkWorkflowPath);

    expect(workflow).toContain("Restore smoke debug keystore");
    expect(workflow).toContain("SMOKE_DEBUG_KEYSTORE_BASE64");
    expect(workflow).toContain("base64 --decode");
    expect(workflow).toContain("android/app/smoke-debug.keystore");
    expect(workflow).toContain("using the runner debug signing key for clean-install artifacts");
    expect(workflow).toContain("SMOKE_DEBUG_KEYSTORE_FILE: smoke-debug.keystore");
    expect(workflow).toContain("SMOKE_DEBUG_KEYSTORE_PASSWORD");
    expect(workflow).toContain("SMOKE_DEBUG_KEY_ALIAS");
    expect(workflow).toContain("SMOKE_DEBUG_KEY_PASSWORD");
    expect(workflow).toContain("actions/upload-artifact@v4");
    expect(workflow).toContain("Remove smoke debug keystore");
    expect(workflow).toContain("rm -f android/app/smoke-debug.keystore");
  });

  it("keeps signing material ignored by default", () => {
    const gitignore = readFile(gitignorePath);

    expect(gitignore).toContain("*.jks");
    expect(gitignore).toContain("*.keystore");
  });
});
