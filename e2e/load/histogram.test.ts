import { describe, expect, it } from "vitest";
import { Histogram } from "./histogram.ts";

describe("Histogram", () => {
  it("gives percentiles to the 10 ms bucket and the exact maximum", () => {
    const h = new Histogram();
    for (let ms = 1; ms <= 1000; ms++) h.add(ms);
    expect(h.count).toBe(1000);
    expect(h.percentile(50)).toBe(510); // 500 falls in the 500-510 bucket
    expect(h.percentile(95)).toBe(960);
    expect(h.max).toBe(1000);
  });

  it("answers 0 when empty", () => {
    expect(new Histogram().percentile(95)).toBe(0);
  });
});
