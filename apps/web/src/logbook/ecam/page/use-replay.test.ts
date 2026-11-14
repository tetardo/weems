import { describe, expect, it } from "vitest";
import { replayStep } from "./use-replay.ts";

describe("replayStep", () => {
  it("plays one flight minute in 2 s at ×30, a 5 min cell in 5 s at ×60", () => {
    expect(replayStep(30, 1)).toBe(2000);
    expect(replayStep(60, 5)).toBe(5000);
  });
});
