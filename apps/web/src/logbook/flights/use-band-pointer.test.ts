import { describe, expect, it } from "vitest";
import { minuteAt } from "./use-band-pointer.ts";

describe("minuteAt", () => {
  it("reads the minute from the abscissa, gaps included", () => {
    expect(minuteAt(100, 100, 450, 45)).toBe(0);
    expect(minuteAt(109.5, 100, 450, 45)).toBe(0);
    expect(minuteAt(110, 100, 450, 45)).toBe(1);
    expect(minuteAt(550, 100, 450, 45)).toBe(44);
  });

  it("reads nothing outside the cells (the names column) or without cells", () => {
    expect(minuteAt(99, 100, 450, 45)).toBeNull();
    expect(minuteAt(551, 100, 450, 45)).toBeNull();
    expect(minuteAt(200, 100, 450, 0)).toBeNull();
  });
});
