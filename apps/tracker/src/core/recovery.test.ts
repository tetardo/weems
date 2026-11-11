import { describe, expect, it } from "vitest";
import { decideRecovery, type SavedFlight } from "./recovery.ts";

const saved: SavedFlight = {
  flightId: "f",
  aircraftTitle: "Airbus A320neo",
  lastSeq: 12,
  lastPositionSeq: 40,
  lastPhase: "CRUISE",
  lastLat: 46,
  lastLon: 2,
  lastAt: "2026-11-11T09:00:00.000Z",
};
const now = (minutesLater: number, lat = 46, title = "Airbus A320neo") => ({
  aircraftTitle: title,
  lat,
  lon: 2,
  utcMs: Date.parse("2026-11-11T09:00:00.000Z") + minutesLater * 60_000,
});

describe("decideRecovery (ENF-02)", () => {
  it("resumes the same aircraft, nearby, within 30 minutes", () => {
    expect(decideRecovery(saved, now(10, 46.05))).toBe("resume");
  });

  it("interrupts after more than 30 minutes", () => {
    expect(decideRecovery(saved, now(31))).toBe("interrupt");
  });

  it("interrupts when the aircraft moved more than 5 NM", () => {
    expect(decideRecovery(saved, now(5, 46.2))).toBe("interrupt");
  });

  it("interrupts with another aircraft", () => {
    expect(decideRecovery(saved, now(5, 46, "Cessna 172"))).toBe("interrupt");
  });

  it("interrupts when no position was ever saved", () => {
    expect(decideRecovery({ ...saved, lastAt: null }, now(1))).toBe("interrupt");
  });
});
