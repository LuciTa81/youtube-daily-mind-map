import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const reviewPath = join(process.cwd(), "docs", "checklists", "product-ux-review.md");

function readReview(): string {
  return readFileSync(reviewPath, "utf8");
}

describe("product UX review checklist", () => {
  it("records the phone-less evidence boundary before UI changes", () => {
    const review = readReview();

    expect(review).toContain("phone-less product UX pass");
    expect(review).toContain("does not include a browser screenshot");
    expect(review).toContain("must not be used to justify visual-only CSS changes");
    expect(review).toContain("360px to 430px mobile viewport");
  });

  it("keeps the review focused on YouTube memory product surfaces", () => {
    const review = readReview();

    expect(review).toContain("Home daily and weekly memory surface");
    expect(review).toContain("Timeline viewing-record surface");
    expect(review).toContain("Takeout and Drive import surface");
    expect(review).toContain("YouTube share memory visibility");
    expect(review).toContain("Keep the product YouTube-first and Android-primary.");
  });

  it("prioritizes product UX candidates without adding AI or duration claims", () => {
    const review = readReview();

    expect(review).toContain("Import first-action hierarchy");
    expect(review).toContain("Home share-memory discoverability");
    expect(review).toContain("Timeline saved-memory scanning");
    expect(review).toContain("Do not claim viewing duration.");
    expect(review).toContain("Run `npm run smoke:import-surface`");
    expect(review).not.toContain("watch time");
    expect(review).not.toContain("usage time");
  });
});
