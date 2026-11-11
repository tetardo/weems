import type {
  CloseFlightRequest,
  FlightEvent,
  OpenFlightRequest,
  PositionReport,
  Sample,
} from "@weems/contrats";
import { beforeEach, describe, expect, it } from "vitest";
import { AIRLINER_PARAMS } from "./phases/params.ts";
import { FlightSession } from "./session.ts";
import { RUNNING, sample } from "./testing/sample.ts";

const A320 = {
  simulator: "replay" as const,
  title: "Airbus A320neo",
  model: "A20N",
  registration: null,
  engineCount: 2,
  emptyWeightKg: null,
};
const START_UTC = Date.UTC(2026, 10, 11, 8, 0, 0);

let session: FlightSession;
let opened: OpenFlightRequest[];
let events: FlightEvent[];
let positions: PositionReport[];
let closed: CloseFlightRequest[];
let t: number;

function hold(seconds: number, state: Partial<Sample> = {}): void {
  for (let i = 0; i < seconds; i++) {
    t += 1000;
    session.handleSample(sample({ t, ...state }));
  }
}

beforeEach(() => {
  [opened, events, positions, closed, t] = [[], [], [], [], 0];
  session = new FlightSession(
    {
      callsign: "WMS123",
      trackerVersion: "0.1.0",
      clock: { nowUtcMs: () => START_UTC },
      newFlightId: () => "0197a000-0000-7000-8000-000000000042",
      params: AIRLINER_PARAMS,
    },
    {
      open: (r) => opened.push(r),
      event: (e) => events.push(e),
      position: (p) => positions.push(p),
      close: (c) => closed.push(c),
    },
  );
});

describe("opening (EF-07)", () => {
  it("waits for an aircraft, then for the first engine start", () => {
    hold(5);
    expect(session.state).toBe("waiting");
    session.setAircraft(A320);
    hold(5);
    expect(session.state).toBe("armed");
    expect(opened).toEqual([]);
    hold(1, { engines: RUNNING });
    expect(session.state).toBe("flying");
    expect(opened).toEqual([
      {
        flightId: "0197a000-0000-7000-8000-000000000042",
        callsign: "WMS123",
        aircraft: A320,
        departureIcao: null,
        plannedArrivalIcao: null,
        openedAt: "2026-11-11T08:00:00.000Z",
        trackerVersion: "0.1.0",
      },
    ]);
  });

  it("opens at pushback even with engines off", () => {
    session.setAircraft(A320);
    hold(1, { pushback: true });
    expect(session.state).toBe("flying");
  });

  it("opens directly when the aircraft is loaded in the air", () => {
    session.setAircraft(A320);
    hold(1, { onGround: false, altAgl: 30000, vs: 0, gs: 450, engines: RUNNING });
    expect(events[0]?.context).toEqual({ from: null, to: "CRUISE", airStart: true });
  });
});

describe("events and positions", () => {
  beforeEach(() => {
    session.setAircraft(A320);
    hold(1, { engines: RUNNING });
  });

  it("numbers events from 1 and dates them on the sample timeline", () => {
    hold(3, { engines: RUNNING, pushback: true });
    expect(events.map((e) => [e.seq, e.at, e.context["to"]])).toEqual([
      [1, "2026-11-11T08:00:00.000Z", "BOARDING"],
      // pushback seen at +1 s, confirmed 2 s later
      [2, "2026-11-11T08:00:03.000Z", "PUSHBACK"],
    ]);
  });

  it("sends no position while parked, then one every 10 s when taxiing", () => {
    hold(20, { engines: RUNNING });
    expect(positions).toEqual([]);
    hold(30, { engines: RUNNING, gs: 15, parkingBrake: false });
    // Taxi seen from +21 s, TAXI_OUT confirmed 5 s later, then a position every 10 s.
    expect(positions.map((p) => [p.seq, p.at, p.phase])).toEqual([
      [1, "2026-11-11T08:00:26.000Z", "TAXI_OUT"],
      [2, "2026-11-11T08:00:36.000Z", "TAXI_OUT"],
      [3, "2026-11-11T08:00:46.000Z", "TAXI_OUT"],
    ]);
  });

  it("notes pause, time acceleration and slew with their time", () => {
    hold(1, { engines: RUNNING, paused: true });
    hold(1, { engines: RUNNING, simRate: 4 });
    hold(1, { engines: RUNNING, simRate: 4, slew: true });
    expect(events.slice(1).map((e) => [e.type, e.context])).toEqual([
      ["paused", {}],
      ["unpaused", {}],
      ["simRateChanged", { from: 1, to: 4 }],
      ["slew", { active: true }],
    ]);
  });
});

describe("closing", () => {
  beforeEach(() => {
    session.setAircraft(A320);
    hold(1, { engines: RUNNING });
  });

  it("closes with reason crash on a simulator crash, and ignores what follows", () => {
    session.handleSimEvent({ t, type: "crashed" });
    hold(5, { engines: RUNNING });
    expect(events.map((e) => e.type)).toEqual(["phaseChanged", "crashed", "phaseChanged"]);
    expect(closed).toEqual([{ closedAt: "2026-11-11T08:00:00.000Z", reason: "crash" }]);
  });

  it("closes with reason aircraftChanged when another aircraft is loaded", () => {
    session.setAircraft({ ...A320, title: "Cessna 172" });
    expect(events.map((e) => e.type)).toContain("aircraftChanged");
    expect(closed[0]?.reason).toBe("aircraftChanged");
  });

  it("closes manually", () => {
    session.closeManually();
    session.closeManually();
    expect(closed).toEqual([{ closedAt: "2026-11-11T08:00:00.000Z", reason: "manual" }]);
    expect(events.at(-1)?.context).toEqual({ from: "BOARDING", to: "ARRIVED" });
  });
});
