import { describe, expect, it } from "vitest";
import { compareVersions, isZeroMajor, lowestVersion, versionGap } from "./version-gap.ts";

describe("versionGap", () => {
  it("classes an update by semantic versioning", () => {
    expect(versionGap("6.0.3", "7.0.2")).toBe("major");
    expect(versionGap("1.62.0", "1.72.0")).toBe("minor");
    expect(versionGap("1.7.20", "1.7.21")).toBe("patch");
    expect(versionGap("16.4.6", "16.4.6")).toBe("current");
  });

  it("counts a minor step below 1.0 as major (0.34 → 0.35 may break)", () => {
    expect(versionGap("0.34.5", "0.35.5")).toBe("major");
    expect(versionGap("0.31.10", "0.31.11")).toBe("patch");
    expect(isZeroMajor("0.34.5")).toBe(true);
    expect(isZeroMajor("1.0.0")).toBe(false);
  });

  it("never asks to go back nor guesses on a tag or a range", () => {
    expect(versionGap("7.0.0", "6.9.9")).toBe("current");
    expect(versionGap("1.5.0", "1.4.9")).toBe("current");
    expect(versionGap("1.0.0-beta.1", "1.0.0")).toBe("current");
    expect(versionGap("^24.19.2", "26.6.6")).toBe("current");
  });
});

describe("compareVersions and lowestVersion", () => {
  it("compares numbers, not text", () => {
    expect(compareVersions("1.10.0", "1.9.0")).toBeGreaterThan(0);
    expect(lowestVersion(["4.6.10", "4.6.7"])).toBe("4.6.7");
  });
});
