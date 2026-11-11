import { describe, expect, it } from "vitest";
import { alphaReport, type FlightFacts } from "./alpha-report.ts";
import { formatAlphaReport } from "./format-report.ts";

const now = new Date("2026-12-20T12:00:00.000Z");
const closedFlight = (pilot: number, phases: FlightFacts["phases"] = "correct"): FlightFacts => ({
  pilotId: `pilot-${pilot}`,
  openedAt: new Date("2026-12-10T08:00:00.000Z"),
  closedAt: new Date("2026-12-10T10:00:00.000Z"),
  hasTrack: true,
  phases,
});
/** 5 pilots × 10 flights, all checked and right. */
const fullAlpha = () => Array.from({ length: 50 }, (_, i) => closedFlight(i % 5));

describe("alpha report (spec J3)", () => {
  it("passes with 5 pilots, 50 flights, none lost, phases right on 95 %", () => {
    const facts = fullAlpha();
    facts[0] = closedFlight(0, "wrong"); // 49 / 50 = 98 %
    facts[1] = closedFlight(1, null); // not checked: left out of the share
    const report = alphaReport(facts, now);
    expect(report).toMatchObject({ pilots: 5, closedFlights: 50, reviewed: 49, correct: 48 });
    expect(report.correctShare).toBeCloseTo(48 / 49);
    expect(report.passed).toBe(true);
  });

  it("counts a flight open for more than 24 h, or closed without trajectory, as possibly lost", () => {
    const facts = [
      ...fullAlpha(),
      { ...closedFlight(0), closedAt: null, openedAt: new Date("2026-12-19T11:00:00.000Z") },
      { ...closedFlight(0), closedAt: null, openedAt: new Date("2026-12-20T11:00:00.000Z") },
      { ...closedFlight(1), hasTrack: false },
    ];
    const report = alphaReport(facts, now);
    expect(report).toMatchObject({ staleFlights: 1, closedWithoutTrack: 1, flights: 53 });
    expect(report.checks.noLostFlight).toBe(false);
    expect(report.passed).toBe(false);
  });

  it("fails below the thresholds and when nothing was checked", () => {
    const report = alphaReport(
      Array.from({ length: 49 }, (_, i) => closedFlight(i % 4, null)),
      now,
    );
    expect(report.checks).toEqual({
      pilots: false,
      flights: false,
      noLostFlight: true,
      phases: false,
    });
    expect(report.correctShare).toBeNull();
    expect(formatAlphaReport(report, now)).toContain("aucun vol vérifié");
  });
});
