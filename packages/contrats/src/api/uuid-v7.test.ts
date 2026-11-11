import { describe, expect, it } from "vitest";
import { FlightId } from "./common.ts";
import { uuidV7 } from "./uuid-v7.ts";

describe("uuidV7", () => {
  it("produces ids accepted as flight ids", () => {
    expect(FlightId.safeParse(uuidV7()).success).toBe(true);
  });

  it("sorts ids by creation time", () => {
    const earlier = uuidV7(Date.UTC(2026, 10, 11, 8, 0, 0));
    const later = uuidV7(Date.UTC(2026, 10, 11, 8, 0, 1));
    expect(earlier < later).toBe(true);
  });

  it("never repeats an id within the same millisecond", () => {
    const now = Date.now();
    expect(uuidV7(now)).not.toBe(uuidV7(now));
  });
});
