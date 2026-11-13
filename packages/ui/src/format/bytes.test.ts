import { describe, expect, it } from "vitest";
import { bytes } from "./bytes.ts";

describe("bytes", () => {
  it("writes sizes in French, one decimal under 10 Mo", () => {
    expect(bytes(412_000_000)).toBe("412 Mo");
    expect(bytes(1_234_000_000)).toBe("1,2 Go");
    expect(bytes(3_420_000)).toBe("3,4 Mo");
    expect(bytes(820_000)).toBe("820 ko");
  });
});
