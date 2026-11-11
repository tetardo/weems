import type { PositionReport } from "@weems/contrats";
import { beforeEach, describe, expect, it } from "vitest";
import type { LiveFlightInfo } from "../flights/live-feed.ts";
import { LiveBoard } from "./live-board.ts";

const info: LiveFlightInfo = {
  flightId: "0197a000-0000-7000-8000-000000000001",
  callsign: "WMS101",
  aircraftTitle: "Airbus A320neo",
  aircraftModel: "A20N",
  departureIcao: "LFLL",
  plannedArrivalIcao: "LFMN",
};
const report = (seq: number): PositionReport => ({
  seq,
  at: "2026-11-11T08:00:00.000Z",
  lat: 45,
  lon: 6,
  altMsl: 24000,
  gs: 400,
  heading: 140,
  vs: 0,
  phase: "CRUISE",
  onGround: false,
});

let now: number;
let board: LiveBoard;
beforeEach(() => {
  now = Date.parse("2026-11-11T08:00:00.000Z");
  board = new LiveBoard(() => now);
});

describe("live board", () => {
  it("reports a new position once, then nothing until the next change", () => {
    board.position(info, report(1));
    expect(board.takeUpdate()).toEqual({
      flights: [
        { ...info, position: report(1), receivedAt: "2026-11-11T08:00:00.000Z", signal: "ok" },
      ],
      removed: [],
    });
    expect(board.takeUpdate()).toBeNull();
  });

  it("keeps only the newest position of a flight in a batch", () => {
    board.position(info, report(1));
    board.position(info, report(2));
    expect(board.takeUpdate()?.flights.map((f) => f.position.seq)).toEqual([2]);
  });

  it("marks a flight silent for 60 s as signal lost", () => {
    board.position(info, report(1));
    board.takeUpdate();
    now += 61_000;
    expect(board.takeUpdate()?.flights[0]?.signal).toBe("lost");
    expect(board.takeUpdate()).toBeNull();
  });

  it("takes a flight off the map after 10 minutes without news, without closing it", () => {
    board.position(info, report(1));
    board.takeUpdate();
    now += 10 * 60_000 + 1;
    expect(board.takeUpdate()?.removed).toEqual([info.flightId]);
    expect(board.snapshot().flights).toEqual([]);
  });

  it("takes a closed flight off the map", () => {
    board.position(info, report(1));
    board.closed(info.flightId);
    expect(board.takeUpdate()).toEqual({ flights: [], removed: [info.flightId] });
  });

  it("lists every flight on the map in the snapshot", () => {
    board.position(info, report(3));
    expect(board.snapshot().flights.map((f) => f.callsign)).toEqual(["WMS101"]);
  });
});
