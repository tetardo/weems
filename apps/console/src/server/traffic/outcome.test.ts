import { describe, expect, it } from "vitest";
import { failedCriteria, outcomeOf } from "./outcome.ts";

describe("outcome of a run", () => {
  it("counts the failed criteria of a load report, unmeasured ones apart", () => {
    const report = { criteria: [{ passed: true }, { passed: false }, { passed: null }] };
    expect(failedCriteria(JSON.stringify(report))).toBe(1);
    expect(failedCriteria("not json")).toBeNull();
  });

  it("says stopped, success or why it failed", () => {
    expect(outcomeOf(143, true, null)).toEqual({ outcome: "stopped", detail: null });
    expect(outcomeOf(0, false, 0)).toEqual({ outcome: "success", detail: null });
    expect(outcomeOf(1, false, 2)).toEqual({ outcome: "failed", detail: "2 critères ratés" });
    expect(outcomeOf(1, false, null)).toEqual({ outcome: "failed", detail: "code 1" });
  });
});
