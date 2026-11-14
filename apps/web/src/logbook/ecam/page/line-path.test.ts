import { describe, expect, it } from "vitest";
import { linePath } from "./line-path.ts";

describe("linePath", () => {
  it("joins the known values and skips the missing ones", () => {
    expect(
      linePath(
        [0, null, 10],
        (i) => i * 10,
        (v) => 100 - v,
      ),
    ).toBe("M0.0,100.0L20.0,90.0");
    expect(
      linePath(
        [null],
        (i) => i,
        (v) => v,
      ),
    ).toBe("");
  });
});
