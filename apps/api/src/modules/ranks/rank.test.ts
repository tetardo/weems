import { describe, expect, it } from "vitest";
import { type RankedFlight, pilotRank, rankFor } from "./rank.ts";

let n = 0;
function flight(hours: number, validity: RankedFlight["validity"] = "valid"): RankedFlight {
  n += 1;
  const day = String(1 + (n % 28)).padStart(2, "0");
  const closedAt = `2026-${String(1 + (Math.floor(n / 28) % 12)).padStart(2, "0")}-${day}T10:00:00.000Z`;
  return {
    flightId: `0190f5a0-0000-7000-8000-${String(n).padStart(12, "0")}`,
    openedAt: closedAt,
    closedAt,
    departureIcao: "LFML",
    arrivalIcao: "LFMN",
    aircraftTitle: "A320neo",
    airborneS: hours * 3600,
    validity,
  };
}

describe("rankFor", () => {
  it("needs both thresholds", () => {
    expect(rankFor(0, 0)).toBe("student");
    expect(rankFor(5, 3)).toBe("cadet");
    expect(rankFor(400, 3)).toBe("cadet"); // long autopilot flights alone are not enough
    expect(rankFor(4.9, 300)).toBe("student"); // circuits alone are not enough
    expect(rankFor(250, 100)).toBe("captain");
    expect(rankFor(10_000, 10_000)).toBe("legend");
  });
});

describe("pilotRank", () => {
  it("starts as student with nothing flown", () => {
    const rank = pilotRank([]);
    expect(rank).toMatchObject({ rank: "student", reachedAt: null, validFlights: 0 });
    expect(rank.next).toEqual({ rank: "cadet", hours: 5, flights: 3 });
  });

  it("counts only valid flights and dates the rank by the flight that reached it", () => {
    const flights = [flight(2), flight(2), flight(0.1, "tooShort"), flight(2), flight(1)];
    const rank = pilotRank(flights);
    expect(rank.rank).toBe("cadet");
    expect(rank.validFlights).toBe(4);
    expect(rank.validHours).toBeCloseTo(7);
    expect(rank.totalHours).toBeCloseTo(7.1);
    expect(rank.reachedAt).toBe(flights[3]?.closedAt);
  });

  it("lists the last flights first, rejected ones at 0 hour", () => {
    const flights = [flight(1), flight(3, "moved")];
    const [last, before] = pilotRank(flights.toReversed()).recentFlights;
    expect(last).toMatchObject({ validity: "moved", countedHours: 0 });
    expect(before?.countedHours).toBeCloseTo(1);
  });

  it("has no next rank at the top", () => {
    const flights = Array.from({ length: 700 }, () => flight(4));
    const rank = pilotRank(flights);
    expect(rank.rank).toBe("legend");
    expect(rank.next).toBeNull();
    expect(rank.recentFlights).toHaveLength(5);
  });
});
