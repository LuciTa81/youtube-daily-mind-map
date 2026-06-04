import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const vercelDeploymentPath = join(process.cwd(), "docs", "vercel-deployment.md");
const releaseChecklistPath = join(process.cwd(), "docs", "checklists", "release.md");
const gitignorePath = join(process.cwd(), ".gitignore");

function readFile(path: string): string {
  return readFileSync(path, "utf8");
}

describe("Vercel deployment access policy", () => {
  it("documents public, protected, and automation access modes", () => {
    const guide = readFile(vercelDeploymentPath);

    expect(guide).toContain("Vercel Deployment Access");
    expect(guide).toContain("landing, demo, guide, and shared-report surface");
    expect(guide).toContain("Public sharing");
    expect(guide).toContain("Vercel Deployment Protection is disabled");
    expect(guide).toContain("Protected preview");
    expect(guide).toContain("Automation-only verification");
    expect(guide).toContain("Do not present a Deployment Protection login page as the public product experience");
  });

  it("keeps protected deployment bypass values out of the repository", () => {
    const guide = readFile(vercelDeploymentPath);
    const gitignore = readFile(gitignorePath);

    expect(guide).toContain("vercel curl");
    expect(guide).toContain("protection bypass token stored outside the repository");
    expect(guide).toContain("trusted-source/OIDC");
    expect(guide).toContain("Never commit bypass tokens");
    expect(guide).toContain("Vercel auth tokens");
    expect(guide).toContain("cookies");
    expect(guide).toContain("x-vercel-protection-bypass");
    expect(guide).toContain("If the deployment is protected and no bypass/CLI access is available, report the limitation");
    expect(gitignore).toContain(".env*");
    expect(gitignore).toContain(".vercel");
  });

  it("adds Vercel deployment access checks to the release checklist", () => {
    const checklist = readFile(releaseChecklistPath);

    expect(checklist).toContain("docs/vercel-deployment.md");
    expect(checklist).toContain("## Web And Vercel Deployment");
    expect(checklist).toContain("GitHub commit status or the Vercel dashboard");
    expect(checklist).toContain("Deployment Protection is disabled");
    expect(checklist).toContain("protected preview");
    expect(checklist).toContain("vercel curl");
    expect(checklist).toContain("CI-secret bypass token");
    expect(checklist).toContain("trusted-source/OIDC");
    expect(checklist).toContain("No `x-vercel-protection-bypass` token");
    expect(checklist).toContain("returned the app shell or a Vercel authentication screen");
  });
});
