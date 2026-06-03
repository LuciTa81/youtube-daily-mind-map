import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const appShellPath = join(process.cwd(), "src", "components", "layout", "AppShell.tsx");

function readAppShellSource(): string {
  return readFileSync(appShellPath, "utf8").replace(/\r\n/g, "\n");
}

describe("mobile hero summary layout", () => {
  it("does not lock the header summary cards into three columns on narrow mobile screens", () => {
    const source = readAppShellSource();

    expect(source).toContain("mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3");
    expect(source).not.toContain("mt-5 grid grid-cols-3 gap-2");
  });

  it("allows long Korean summary values to truncate within their grid cells", () => {
    const source = readAppShellSource();

    expect(source).toContain('className="min-w-0 rounded-lg bg-white/15 p-3 backdrop-blur"');
    expect(source).toContain('className="col-span-2 min-w-0 rounded-lg bg-white/15 p-3 backdrop-blur sm:col-span-1"');
  });
});
