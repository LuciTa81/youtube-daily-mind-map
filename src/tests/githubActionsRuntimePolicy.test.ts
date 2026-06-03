import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const workflowNames = ["quality.yml", "android-apk.yml"] as const;

function readWorkflow(name: (typeof workflowNames)[number]): string {
  return readFileSync(join(process.cwd(), ".github", "workflows", name), "utf8");
}

describe("GitHub Actions runtime policy", () => {
  it.each(workflowNames)("opts %s into the Node 24 JavaScript action runtime", (workflowName) => {
    const workflow = readWorkflow(workflowName);

    expect(workflow).toMatch(/^env:\r?\n(?:  [A-Z0-9_]+: .+\r?\n)*  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: "true"/m);
    expect(workflow).not.toContain("ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION");
  });
});
