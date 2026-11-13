import { describe, expect, it } from "vitest";
import { DRUM, nextOnDrum, rollStep, toCells } from "./flap-roll.ts";

describe("split-flap drum", () => {
  it("pads and cuts the text to the cells, in capitals", () => {
    expect(toCells("lfml", 5)).toEqual(["L", "F", "M", "L", " "]);
    expect(toCells("AFR18440", 7)).toHaveLength(7);
  });

  it("turns one flap forward, wrapping round the drum", () => {
    expect(nextOnDrum("A", "C")).toBe("B");
    expect(nextOnDrum(".", "A")).toBe(" ");
    expect(nextOnDrum("é", "A")).toBe("A");
  });

  it("reaches the new text in at most one turn of the drum", () => {
    let cells = toCells("AFR1", 4);
    const target = toCells("EZY7", 4);
    let steps = 0;
    for (;;) {
      const step = rollStep(cells, target);
      if (step.moved === 0) break;
      cells = step.cells;
      steps += 1;
    }
    expect(cells).toEqual(target);
    expect(steps).toBeLessThan(DRUM.length);
  });
});
