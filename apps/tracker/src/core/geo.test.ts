import { describe, expect, it } from "vitest";
import { distanceNm } from "./geo.ts";

describe("distanceNm", () => {
  it("counts 60 NM per degree of latitude", () => {
    expect(distanceNm(45, 2, 46, 2)).toBeCloseTo(60, 0);
  });
});
