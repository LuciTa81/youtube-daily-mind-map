import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const signingAdrPath = join(process.cwd(), "docs", "adr", "0004-ci-debug-apk-smoke-signing.md");
const playSigningAdrPath = join(process.cwd(), "docs", "adr", "0008-play-store-upload-signing.md");
const releaseGuidePath = join(process.cwd(), "docs", "release-guide.md");
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

  it("records the Play Store upload signing lane separately from smoke signing", () => {
    const adr = readFile(playSigningAdrPath);

    expect(adr).toContain("ADR 0008: Play Store Upload Signing");
    expect(adr).toContain("Accepted");
    expect(adr).toContain("Play App Signing");
    expect(adr).toContain("Android App Bundle");
    expect(adr).toContain("bundleRelease");
    expect(adr).toContain("Play upload signing key");
    expect(adr).toContain("never the smoke debug signing certificate or Android debug keystore");
    expect(adr).toContain("PLAY_UPLOAD_KEYSTORE_FILE");
    expect(adr).toContain("PLAY_UPLOAD_KEYSTORE_PASSWORD");
    expect(adr).toContain("PLAY_UPLOAD_KEY_ALIAS");
    expect(adr).toContain("PLAY_UPLOAD_KEY_PASSWORD");
    expect(adr).toContain("Partial Play signing configuration must fail the build");
    expect(adr).toContain("app-release-unsigned.apk");
    expect(adr).toContain("locally smoke-signed release APKs are release-variant smoke artifacts only");
    expect(adr).toContain("must not be described as Play Store candidates");
    expect(adr).toContain("local upload-key-signed APK must not be used to claim update compatibility");
    expect(adr).toContain("Play internal testing");
    expect(adr).toContain("final app signing certificate");
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
    expect(releaseChecklist).toContain("## Play Store Upload Signing");
    expect(releaseChecklist).toContain("docs/adr/0008-play-store-upload-signing.md");
    expect(releaseChecklist).toContain("docs/release-guide.md");
    expect(releaseChecklist).toContain("Android App Bundle for Play upload");
    expect(releaseChecklist).toContain("app-release-unsigned.apk");
    expect(releaseChecklist).toContain("locally smoke-signed release APKs are treated as smoke artifacts only");
    expect(releaseChecklist).toContain("PLAY_UPLOAD_KEYSTORE_FILE");
    expect(releaseChecklist).toContain("PLAY_UPLOAD_KEYSTORE_PASSWORD");
    expect(releaseChecklist).toContain("PLAY_UPLOAD_KEY_ALIAS");
    expect(releaseChecklist).toContain("PLAY_UPLOAD_KEY_PASSWORD");
    expect(releaseChecklist).toContain("Local upload-key-signed APK update installs are not claimed to prove Play update compatibility");
  });

  it("keeps a release guide for Play artifact types and upload signing setup", () => {
    const releaseGuide = readFile(releaseGuidePath);

    expect(releaseGuide).toContain("Release Guide");
    expect(releaseGuide).toContain("## Artifact Types");
    expect(releaseGuide).toContain("Debug APK");
    expect(releaseGuide).toContain("Smoke debug APK");
    expect(releaseGuide).toContain("Locally smoke-signed release APK");
    expect(releaseGuide).toContain("Play Store candidate");
    expect(releaseGuide).toContain("app-release-unsigned.apk");
    expect(releaseGuide).toContain("Android App Bundle");
    expect(releaseGuide).toContain("bundleRelease");
    expect(releaseGuide).toContain("PLAY_UPLOAD_KEYSTORE_FILE");
    expect(releaseGuide).toContain("PLAY_UPLOAD_KEYSTORE_PASSWORD");
    expect(releaseGuide).toContain("PLAY_UPLOAD_KEY_ALIAS");
    expect(releaseGuide).toContain("PLAY_UPLOAD_KEY_PASSWORD");
    expect(releaseGuide).toContain("Never commit `.jks`, `.keystore`, `.apk`, `.aab`");
    expect(releaseGuide).toContain("Never reuse the smoke debug signing certificate");
    expect(releaseGuide).toContain("Fail the build if only part of the Play signing configuration is present");
    expect(releaseGuide).toContain("Play internal testing");
    expect(releaseGuide).toContain("same final app signing certificate");
    expect(releaseGuide).toContain("npm run verify");
    expect(releaseGuide).toContain("npx cap sync android");
    expect(releaseGuide).toContain("android/gradlew assembleRelease");
    expect(releaseGuide).toContain("android/gradlew bundleRelease");
    expect(releaseGuide).toContain("Release logcat privacy smoke");
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
    expect(androidSmokeChecklist).toContain("docs/adr/0008-play-store-upload-signing.md");
    expect(androidSmokeChecklist).toContain("locally smoke-signed release APKs are not treated as Play Store candidates");
    expect(androidSmokeChecklist).toContain("local upload-key-signed APK installs are not used to claim Play-delivered update compatibility");
    expect(androidSmokeChecklist).toContain("Play-installed update behavior was validated through Play internal testing");
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
    expect(workflow).toContain("actions/upload-artifact@v7");
    expect(workflow).toContain("Remove smoke debug keystore");
    expect(workflow).toContain("rm -f android/app/smoke-debug.keystore");
  });

  it("keeps signing material ignored by default", () => {
    const gitignore = readFile(gitignorePath);

    expect(gitignore).toContain("*.jks");
    expect(gitignore).toContain("*.keystore");
    expect(gitignore).toContain("*.apk");
    expect(gitignore).toContain("*.aab");
  });
});
