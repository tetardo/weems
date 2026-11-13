import { SINGLE_CODE_PATTERN } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { canonicalCode, newSingleCode } from "./codes.ts";

describe("offer codes", () => {
  it("makes readable single codes, never with 0, O, 1, I or L", () => {
    for (let i = 0; i < 200; i++) {
      const code = newSingleCode();
      expect(code).toMatch(SINGLE_CODE_PATTERN);
      expect(code.slice(6)).not.toMatch(/[01OIL]/);
    }
  });

  it("reads a code however it was typed", () => {
    expect(canonicalCode(" weems-7k4q-m2xp ")).toBe("WEEMS-7K4Q-M2XP");
    expect(canonicalCode("weems7k4qm2xp")).toBe("WEEMS-7K4Q-M2XP");
    expect(canonicalCode("WEEMS 7K4Q M2XP")).toBe("WEEMS-7K4Q-M2XP");
    expect(canonicalCode("captain sim")).toBe("CAPTAINSIM");
  });
});
