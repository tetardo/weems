import { describe, expect, it } from "vitest";
import { actionFor, retryDelayMs } from "./retry.ts";

describe("retryDelayMs", () => {
  it("waits 2 s, then 5 s, 15 s… and never more than 5 min (plus jitter)", () => {
    expect([1, 2, 3, 7, 50].map((n) => retryDelayMs(n, () => 0))).toEqual([
      2_000, 5_000, 15_000, 300_000, 300_000,
    ]);
    expect(retryDelayMs(1, () => 1)).toBe(2_400);
  });
});

describe("actionFor", () => {
  it.each([
    [200, "done"],
    [201, "done"],
    [400, "park"],
    [404, "park"],
    [409, "park"],
    [401, "unauthorized"],
    [426, "upgradeRequired"],
    [500, "retry"],
    [503, "retry"],
    ["networkError", "retry"],
  ] as const)("%s → %s", (status, action) => {
    expect(actionFor(status)).toBe(action);
  });
});
