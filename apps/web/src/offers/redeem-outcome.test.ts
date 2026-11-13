import { describe, expect, it } from "vitest";
import { refusalOf, typedCode } from "./redeem-outcome.ts";

describe("offer code form", () => {
  it("reads the code as typed, in upper case", () => {
    expect(typedCode("  weems-ab2c-d3ef ")).toBe("WEEMS-AB2C-D3EF");
    expect(typedCode(null)).toBe("");
  });

  it("says what each refusal means", () => {
    expect(refusalOf(404)).toEqual({ status: "unknown" });
    expect(refusalOf(409)).toEqual({ status: "already" });
    expect(refusalOf(410)).toEqual({ status: "gone" });
    expect(refusalOf(429)).toEqual({ status: "tooMany" });
    expect(refusalOf(500)).toEqual({ status: "error" });
  });
});
