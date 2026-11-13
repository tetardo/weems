import { describe, expect, it } from "vitest";
import { ANNOUNCE_RECENT_MS, shouldAnnounce } from "./rank-announce.ts";

const NOW = Date.parse("2026-11-13T06:00:00.000Z");
const reached = (ago: number) => new Date(NOW - ago).toISOString();

describe("shouldAnnounce", () => {
  it("announces a rank above the last one announced in this browser", () => {
    expect(shouldAnnounce("officer", "captain", reached(ANNOUNCE_RECENT_MS * 10), NOW)).toBe(true);
    expect(shouldAnnounce("captain", "captain", reached(1000), NOW)).toBe(false);
  });

  it("announces a recent rank on a browser that announced nothing", () => {
    expect(shouldAnnounce(null, "cadet", reached(1000), NOW)).toBe(true);
    expect(shouldAnnounce(null, "cadet", reached(ANNOUNCE_RECENT_MS + 1), NOW)).toBe(false);
  });

  it("never announces the first rank, and ignores an unknown stored value", () => {
    expect(shouldAnnounce(null, "student", null, NOW)).toBe(false);
    expect(shouldAnnounce("nonsense", "cadet", reached(1000), NOW)).toBe(true);
  });
});
