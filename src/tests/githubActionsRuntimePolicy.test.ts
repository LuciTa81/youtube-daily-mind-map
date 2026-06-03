import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const workflowPolicies = [
  {
    name: "quality.yml",
    requiredActions: ["actions/checkout@v6", "actions/setup-node@v6", "actions/upload-artifact@v7"],
    deprecatedActions: ["actions/checkout@v4", "actions/setup-node@v4", "actions/upload-artifact@v4"]
  },
  {
    name: "android-apk.yml",
    requiredActions: [
      "actions/checkout@v6",
      "actions/setup-node@v6",
      "actions/setup-java@v5",
      "actions/upload-artifact@v7"
    ],
    deprecatedActions: [
      "actions/checkout@v4",
      "actions/setup-node@v4",
      "actions/setup-java@v4",
      "actions/upload-artifact@v4"
    ]
  }
] as const;

function readWorkflow(name: (typeof workflowPolicies)[number]["name"]): string {
  return readFileSync(join(process.cwd(), ".github", "workflows", name), "utf8");
}

describe("GitHub Actions runtime policy", () => {
  it.each(workflowPolicies)("uses Node 24-compatible action majors in $name", ({ name, requiredActions, deprecatedActions }) => {
    const workflow = readWorkflow(name);

    for (const action of requiredActions) {
      expect(workflow).toContain(action);
    }

    for (const action of deprecatedActions) {
      expect(workflow).not.toContain(action);
    }

    expect(workflow).not.toContain("FORCE_JAVASCRIPT_ACTIONS_TO_NODE24");
    expect(workflow).not.toContain("ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION");
  });

  it("runs the phone-less import surface smoke after the static web build", () => {
    const workflow = readWorkflow("quality.yml");

    expect(workflow).toContain('- "scripts/**"');
    expect(workflow).toContain("npm run build");
    expect(workflow).toContain("npx playwright install --with-deps chromium");
    expect(workflow).toContain("node scripts/serve-static-out.mjs &");
    expect(workflow).toContain("curl -fsS http://127.0.0.1:3001");
    expect(workflow).toContain("npm run smoke:import-surface");
    expect(workflow).toContain("Upload import surface smoke evidence");
    expect(workflow).toContain("if: always()");
    expect(workflow).toContain("name: import-surface-smoke");
    expect(workflow).toContain("path: .codex/import-surface-smoke/");
    expect(workflow).toContain("if-no-files-found: ignore");
    expect(workflow).toContain("retention-days: 7");
  });
});
