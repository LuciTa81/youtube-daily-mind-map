import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const manifestJsonPath = join(root, "public", "manifest.json");
const faviconPath = join(root, "public", "favicon.ico");
const serviceWorkerPath = join(root, "public", "sw.js");
const layoutPath = join(root, "src", "app", "layout.tsx");

function readText(path: string): string {
  return readFileSync(path, "utf8").replace(/\r\n/g, "\n");
}

describe("PWA static asset defaults", () => {
  it("serves a browser-default manifest JSON alias with install icons", () => {
    expect(existsSync(manifestJsonPath)).toBe(true);

    const manifest = JSON.parse(readText(manifestJsonPath)) as {
      name: string;
      start_url: string;
      icons: Array<{ src: string; sizes: string; type: string }>;
    };

    expect(manifest.name).toBe("YouTube Daily Mind Map");
    expect(manifest.start_url).toBe("/");
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }),
        expect.objectContaining({ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" })
      ])
    );
  });

  it("keeps the browser-default favicon path backed by an ICO file", () => {
    expect(existsSync(faviconPath)).toBe(true);

    const favicon = readFileSync(faviconPath);

    expect(favicon.readUInt16LE(0)).toBe(0);
    expect(favicon.readUInt16LE(2)).toBe(1);
    expect(favicon.readUInt16LE(4)).toBe(1);
    expect(favicon.readUInt8(6)).toBe(192);
    expect(favicon.readUInt8(7)).toBe(192);
  });

  it("caches and advertises the default manifest and favicon paths", () => {
    const serviceWorker = readText(serviceWorkerPath);
    const layout = readText(layoutPath);

    expect(serviceWorker).toContain('"/manifest.json"');
    expect(serviceWorker).toContain('"/favicon.ico"');
    expect(layout).toContain('{ url: "/favicon.ico", sizes: "192x192", type: "image/x-icon" }');
  });
});
