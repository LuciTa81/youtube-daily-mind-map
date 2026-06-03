import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const packageJsonPath = join(process.cwd(), "package.json");
const gitignorePath = join(process.cwd(), ".gitignore");
const smokeScriptPath = join(process.cwd(), "scripts", "smoke-import-surface.mjs");
const productReviewPath = join(process.cwd(), "docs", "checklists", "product-ux-review.md");

function read(path: string): string {
  return readFileSync(path, "utf8");
}

describe("import surface smoke script", () => {
  it("adds a stable npm command for phone-less 390px import evidence", () => {
    const packageJson = JSON.parse(read(packageJsonPath)) as { scripts: Record<string, string> };

    expect(packageJson.scripts["smoke:import-surface"]).toBe("node scripts/smoke-import-surface.mjs");
  });

  it("captures screenshots and non-sensitive geometry instead of raw watch records", () => {
    const source = read(smokeScriptPath);

    expect(source).toContain('const DEFAULT_WIDTH = 390');
    expect(source).toContain('const DEFAULT_HEIGHT = 844');
    expect(source).toContain('waitUntil: "domcontentloaded"');
    expect(source).toContain('waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => undefined)');
    expect(source).toContain("async function clickFirstVisible");
    expect(source).toContain('filter({ hasText: /^설정$/ })');
    expect(source).toContain('filter({ hasText: "Takeout 가져오기" })');
    expect(source).toContain('import-page-390.png');
    expect(source).toContain('import-section-390.png');
    expect(source).toContain('import-surface-390.json');
    expect(source).toContain('primaryActionTopWithinViewport');
    expect(source).toContain('noHorizontalOverflow');
    expect(source).not.toContain('watch-history.json');
    expect(source).not.toContain('OAuth');
    expect(source).not.toContain('accessToken');
  });

  it("keeps generated smoke artifacts out of git and documents the command", () => {
    const gitignore = read(gitignorePath);
    const review = read(productReviewPath);

    expect(gitignore).toContain(".codex");
    expect(gitignore).toContain("test-results");
    expect(review).toContain("npm run smoke:import-surface");
    expect(review).toContain("`.codex/import-surface-smoke/`");
  });
});
