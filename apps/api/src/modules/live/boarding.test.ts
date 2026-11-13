import type { Airport, FlightPhase, LiveFlight, PositionReport } from "@weems/contrats";
import { beforeEach, describe, expect, it } from "vitest";
import type { LiveFlightInfo } from "../flights/live-feed.ts";
import { type BoardingSource, boardingStatusOf, buildBoarding } from "./boarding.ts";
import { LiveBoard } from "./live-board.ts";

const T0 = "2026-11-13T08:00:00.000Z";
const at = (minutes: number) => new Date(Date.parse(T0) + minutes * 60_000).toISOString();

const info = (n: number, extra: Partial<LiveFlightInfo> = {}): LiveFlightInfo => ({
  flightId: `0197a000-0000-7000-8000-00000000000${n}`,
  callsign: `WMS10${n}`,
  aircraftTitle: "Airbus A320neo",
  aircraftModel: "A20N",
  aircraftClass: { category: "narrowBody", estimated: false },
  departureIcao: "LFLL",
  plannedArrivalIcao: "LFMN",
  fictitious: false,
  pilotId: `01970000-0000-7000-8000-00000000000${n}`,
  ...extra,
});
const report = (phase: FlightPhase, extra: Partial<PositionReport> = {}): PositionReport => ({
  seq: 1,
  at: T0,
  lat: 45,
  lon: 6,
  altMsl: 24000,
  gs: 400,
  heading: 140,
  vs: 0,
  phase,
  onGround: false,
  ...extra,
});
const source = (
  phase: FlightPhase,
  times: Partial<BoardingSource["times"]> = {},
  flight: Partial<LiveFlight> = {},
): BoardingSource => {
  const { pilotId: _pilotId, ...shown } = info(1);
  return {
    flight: {
      ...shown,
      pilot: null,
      position: report(phase),
      receivedAt: T0,
      signal: "ok",
      ...flight,
    },
    times: { startedAt: T0, takeoffAt: null, landedAt: null, touchdownVs: null, ...times },
  };
};

const NICE: Airport = { icao: "LFMN", name: "Nice Côte d'Azur Airport", lat: 43.6584, lon: 7.2159 };
const findAirport = (icao: string | null) => (icao === "LFMN" ? NICE : null);

describe("status on the board", () => {
  it.each<[FlightPhase, string]>([
    ["BOARDING", "boarding"],
    ["PUSHBACK", "pushback"],
    ["TAXI_OUT", "taxi"],
    ["TAKEOFF", "departed"],
    ["CRUISE", "airborne"],
    ["FINAL", "approach"],
    ["TAXI_IN", "landed"],
  ])("shows %s as %s", (phase, status) => {
    expect(boardingStatusOf(source(phase))).toBe(status);
  });

  it("says « décollé » for 15 minutes of the flight's own clock after take-off, then « en vol »", () => {
    const climbing = { position: report("CLIMB", { at: at(30) }) };
    expect(boardingStatusOf(source("CLIMB", { takeoffAt: at(20) }, climbing))).toBe("departed");
    expect(boardingStatusOf(source("CLIMB", { takeoffAt: at(10) }, climbing))).toBe("airborne");
  });

  it("says « perdu » without signal, but « posé » once landed", () => {
    expect(boardingStatusOf(source("CRUISE", {}, { signal: "lost" }))).toBe("lost");
    expect(boardingStatusOf(source("CRUISE", { landedAt: at(25) }, { signal: "lost" }))).toBe(
      "landed",
    );
  });
});

describe("boards", () => {
  const now = Date.parse(at(60));

  it("estimates the arrival from the remaining distance and the ground speed", () => {
    // About 96 NM from (45, 6) to Nice, at 400 kt: about 14 minutes.
    const [flight] = buildBoarding([source("CRUISE")], [], findAirport, now).arrivals;
    const minutes = (Date.parse(flight?.estimatedArrivalAt ?? "") - Date.parse(T0)) / 60_000;
    expect(minutes).toBeGreaterThan(13);
    expect(minutes).toBeLessThan(16);
    expect(flight).toMatchObject({
      arrivalName: NICE.name,
      departureName: null,
      aircraftType: "A20N",
    });
  });

  it("gives no estimate without an arrival airport, on the ground or before take-off", () => {
    const flights = [
      source("CRUISE", {}, { plannedArrivalIcao: "ZZZZ" }),
      source("TAXI_OUT"),
      source("CRUISE", {}, { position: report("CRUISE", { gs: 20 }) }),
    ];
    const board = buildBoarding(flights, [], findAirport, now);
    expect([...board.departures, ...board.arrivals].map((f) => f.estimatedArrivalAt)).toEqual([
      null,
      null,
      null,
      null,
      null,
    ]);
  });

  it("lists departures newest first, landed flights only on the Arrivals board", () => {
    const board = buildBoarding(
      [
        source("CRUISE", { takeoffAt: at(10) }, { callsign: "OLD" }),
        source("BOARDING", { startedAt: at(55) }, { callsign: "NEW" }),
        source("TAXI_IN", { takeoffAt: at(5), landedAt: at(50) }, { callsign: "DOWN" }),
      ],
      [source("ARRIVED", { landedAt: at(40) }, { callsign: "CLOSED" })],
      findAirport,
      now,
    );
    expect(board.departures.map((f) => f.callsign)).toEqual(["NEW", "OLD"]);
    expect(board.arrivals.map((f) => f.callsign)).toEqual(["OLD", "DOWN", "CLOSED"]);
  });
});

describe("live board times", () => {
  let now: number;
  let board: LiveBoard;
  beforeEach(() => {
    now = Date.parse(T0);
    board = new LiveBoard(() => now);
  });
  const phaseChanged = (from: string, to: string, minutes: number) => ({
    seq: 1,
    at: at(minutes),
    type: "phaseChanged" as const,
    context: { from, to },
  });
  const touchdown = { seq: 2, at: at(50), type: "touchdown" as const, context: { vs: -142 } };

  it("dates the start, the take-off and the touchdown, and keeps a landed flight for an hour", () => {
    board.position(info(1), report("BOARDING"));
    board.events(info(1).flightId, [phaseChanged("TAKEOFF", "CLIMB", 12)]);
    board.events(info(1).flightId, [touchdown]);
    board.closed(info(1).flightId);

    const { live, landed } = board.boardingSources();
    expect(live).toEqual([]);
    expect(landed.map((s) => s.times)).toEqual([
      { startedAt: T0, takeoffAt: at(12), landedAt: at(50), touchdownVs: -142 },
    ]);

    now = Date.parse(at(111));
    expect(board.boardingSources().landed).toEqual([]);
  });

  it("forgets a flight closed without landing", () => {
    board.position(info(2), report("CRUISE"));
    board.closed(info(2).flightId);
    expect(board.boardingSources()).toEqual({ live: [], landed: [] });
  });
});
