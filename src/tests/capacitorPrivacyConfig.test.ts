import config from "../../capacitor.config";
import { describe, expect, it } from "vitest";

describe("Capacitor privacy config", () => {
  it("keeps native bridge logging disabled because import responses can contain watch history items", () => {
    expect(config.loggingBehavior).toBe("none");
  });
});
