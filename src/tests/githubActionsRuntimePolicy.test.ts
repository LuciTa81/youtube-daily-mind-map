import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const workflowPolicies = [
  {
    name: "quality.yml",
    requiredActions: ["actions/checkout@v6", "actions/setup-node@v6"],
    deprecatedActions: ["actions/checkout@v4", "actions/setup-node@v4"]
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
});
