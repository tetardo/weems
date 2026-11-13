import { describe, expect, it } from "vitest";
import { addMonths, nextGiftStart, runningGift } from "./offered.ts";
import type { GrantRecord } from "./repository-grants.ts";

const at = (iso: string) => new Date(iso);
const gift = (startsAt: string, endsAt: string, source: GrantRecord["source"] = "code") => ({
  plan: "pilot_pro",
  source,
  startsAt: at(startsAt),
  endsAt: at(endsAt),
});

describe("plans given without payment", () => {
  const now = at("2026-11-13T10:00:00.000Z");

  it("adds months on the same day, UTC", () => {
    expect(addMonths(now, 12).toISOString()).toBe("2027-11-13T10:00:00.000Z");
  });

  it("runs the current gift until the end of the gifts that follow it without a gap", () => {
    const grants = [
      gift("2026-11-01T00:00:00.000Z", "2027-11-01T00:00:00.000Z", "founder"),
      gift("2027-11-01T00:00:00.000Z", "2028-02-01T00:00:00.000Z"),
      gift("2028-06-01T00:00:00.000Z", "2028-07-01T00:00:00.000Z"),
    ];
    const running = runningGift(grants, now);
    expect(running?.current.source).toBe("founder");
    expect(running?.until.toISOString()).toBe("2028-02-01T00:00:00.000Z");
  });

  it("has no gift before the first one starts", () => {
    expect(runningGift([gift("2026-12-01T00:00:00.000Z", "2027-01-01T00:00:00.000Z")], now)).toBe(
      null,
    );
  });

  it("starts a new gift at the end of the last one, or now", () => {
    expect(nextGiftStart([], now)).toEqual(now);
    const grants = [gift("2026-11-01T00:00:00.000Z", "2027-11-01T00:00:00.000Z")];
    expect(nextGiftStart(grants, now).toISOString()).toBe("2027-11-01T00:00:00.000Z");
  });
});
