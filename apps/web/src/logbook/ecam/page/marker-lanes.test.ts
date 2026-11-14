import { describe, expect, it } from "vitest";
import { markerLanes } from "./marker-lanes.ts";

const m = (cell: number, text = "GEAR UP") => ({ cell, text });

describe("markerLanes", () => {
  it("keeps far labels on the first line and stacks close ones", () => {
    expect(markerLanes([m(2), m(3), m(4), m(60)], 75)).toEqual([0, 1, 2, 0]);
  });

  it("uses at most four lines, then the one that frees first", () => {
    expect(markerLanes([m(1), m(2), m(3), m(4), m(5)], 75)).toEqual([0, 1, 2, 3, 0]);
  });
});
