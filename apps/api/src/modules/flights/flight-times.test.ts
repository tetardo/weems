import type { FlightEvent } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { flightTimes } from "./flight-times.ts";

let seq = 0;
const event = (time: string, type: FlightEvent["type"], context = {}): FlightEvent => ({
  seq: ++seq,
  at: `2026-11-11T${time}.000Z`,
  type,
  context,
});
const phase = (time: string, from: string | null, to: string) =>
  event(time, "phaseChanged", { from, to });
const opened = "2026-11-11T08:00:00.000Z";

describe("flight times", () => {
  const flight = [
    phase("08:10:00", "TAXI_OUT", "TAKEOFF"),
    phase("08:11:00", "TAKEOFF", "CLIMB"),
    event("08:40:00", "paused"),
    event("08:45:00", "unpaused"),
    event("09:31:00", "touchdown"),
  ];

  it("counts block and airborne times without the pause (EF-15)", () => {
    expect(flightTimes({ openedAt: opened, closedAt: "2026-11-11T09:40:00.000Z" }, flight)).toEqual(
      {
        blockS: 100 * 60 - 300,
        airborneS: 80 * 60 - 300,
        pausedS: 300,
      },
    );
  });

  it("leaves block time unknown while the flight is open", () => {
    expect(flightTimes({ openedAt: opened, closedAt: null }, flight).blockS).toBeNull();
  });

  it("counts from opening for a flight started in the air, until the last touchdown", () => {
    const air = [
      event("08:00:00", "phaseChanged", { from: null, to: "CRUISE", airStart: true }),
      event("08:30:00", "touchdown"),
      event("08:30:20", "bounce"),
      event("08:30:25", "touchdown"),
    ];
    expect(flightTimes({ openedAt: opened, closedAt: null }, air).airborneS).toBe(30 * 60 + 25);
  });

  it("has no airborne time without takeoff or touchdown, and closes a pause left open", () => {
    const parked = [event("08:05:00", "paused")];
    const times = flightTimes({ openedAt: opened, closedAt: "2026-11-11T08:15:00.000Z" }, parked);
    expect(times).toEqual({ blockS: 300, airborneS: null, pausedS: 600 });
  });
});
