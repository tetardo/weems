import { describe, expect, it } from "vitest";
import type { ApiProblem } from "./problem.ts";
import { assertTrackerVersion } from "./tracker-version.ts";

const statusOf = (header: string | undefined, minimum = "0.2.0") => {
  try {
    assertTrackerVersion(header, minimum);
    return 200;
  } catch (error) {
    return (error as ApiProblem).status;
  }
};

describe("assertTrackerVersion", () => {
  it("accepts the minimum version and newer ones", () => {
    expect(statusOf("tracker/0.2.0")).toBe(200);
    expect(statusOf("tracker/0.10.0")).toBe(200);
    expect(statusOf("tracker/1.0.0")).toBe(200);
  });

  it("answers 426 to older trackers", () => {
    expect(statusOf("tracker/0.1.9")).toBe(426);
  });

  it("answers 400 to a missing or malformed header", () => {
    expect(statusOf(undefined)).toBe(400);
    expect(statusOf("web/1.0.0")).toBe(400);
    expect(statusOf("tracker/1.0")).toBe(400);
  });
});
