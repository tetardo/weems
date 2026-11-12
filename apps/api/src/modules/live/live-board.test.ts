import { MAX_LIVE_EVENTS, type PositionReport } from "@weems/contrats";
import { beforeEach, describe, expect, it } from "vitest";
import type { LiveFlightInfo } from "../flights/live-feed.ts";
import { LiveBoard } from "./live-board.ts";
import { LivePilots } from "./live-pilots.ts";

const info: LiveFlightInfo = {
  flightId: "0197a000-0000-7000-8000-000000000001",
  callsign: "WMS101",
  aircraftTitle: "Airbus A320neo",
  aircraftModel: "A20N",
  aircraftClass: { category: "narrowBody", estimated: false },
  departureIcao: "LFLL",
  plannedArrivalIcao: "LFMN",
  fictitious: false,
  pilotId: "01970000-0000-7000-8000-000000000001",
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

const { pilotId: _pilotId, ...shown } = info;
const camille = { handle: "camille-r", name: "Camille Roux", country: "FR", hasPhoto: false };

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
        {
          ...shown,
          pilot: null,
          position: report(1),
          receivedAt: "2026-11-11T08:00:00.000Z",
          signal: "ok",
        },
      ],
      removed: [],
      events: [],
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
    expect(board.takeUpdate()).toEqual({ flights: [], removed: [info.flightId], events: [] });
  });

  it("lists every flight on the map in the snapshot", () => {
    board.position(info, report(3));
    expect(board.snapshot().flights.map((f) => f.callsign)).toEqual(["WMS101"]);
  });

  it("shows the pilot once read, and sends the flight again when the profile changes", async () => {
    let publicPilots = new Map([[info.pilotId, camille]]);
    const pilots = new LivePilots(
      () => Promise.resolve(publicPilots),
      () => now,
    );
    board.showPilots(pilots);
    board.position(info, report(1));
    board.takeUpdate();
    await board.refreshPilots();
    const update = board.takeUpdate();
    expect(update?.flights[0]?.pilot).toEqual(camille);
    expect(update?.flights[0]).not.toHaveProperty("pilotId");

    publicPilots = new Map();
    now += 30_000;
    await board.refreshPilots();
    expect(board.takeUpdate()?.flights[0]?.pilot).toBeNull();
  });

  describe("events", () => {
    const phaseChanged = (from: string, to: string) => ({
      seq: 1,
      at: "2026-11-11T08:01:00.000Z",
      type: "phaseChanged" as const,
      context: { from, to },
    });
    const touchdown = {
      seq: 2,
      at: "2026-11-11T09:00:00.000Z",
      type: "touchdown" as const,
      context: { vs: -142 },
    };

    it("announces a take-off and a landing with its vertical speed, from the flight's airports", () => {
      board.position(info, report(1));
      board.takeUpdate();
      board.events(info.flightId, [
        phaseChanged("TAXI_OUT", "TAKEOFF"),
        phaseChanged("TAKEOFF", "CLIMB"),
      ]);
      board.events(info.flightId, [touchdown]);
      const events = board.takeUpdate()?.events;
      expect(events?.map((e) => [e.kind, e.airportIcao, e.touchdownVs])).toEqual([
        ["takeoff", "LFLL", null],
        ["landing", "LFMN", -142],
      ]);
      expect(events?.[0]).toMatchObject({ callsign: "WMS101", pilot: null });
      expect(board.snapshot().events.map((e) => e.kind)).toEqual(["landing", "takeoff"]);
    });

    it("never announces the start of a flight whose pilot is not public", () => {
      board.position(info, { ...report(1), phase: "BOARDING", onGround: true });
      expect(board.takeUpdate()?.events).toEqual([]);
    });

    it("does not announce as started a flight first seen in the air (API restarted)", async () => {
      board.showPilots(new LivePilots(() => Promise.resolve(new Map([[info.pilotId, camille]]))));
      board.position(info, report(1));
      await board.refreshPilots();
      expect(board.takeUpdate()?.events).toEqual([]);
    });

    it("announces the start of a public pilot's flight, with the planned route", async () => {
      board.showPilots(new LivePilots(() => Promise.resolve(new Map([[info.pilotId, camille]]))));
      board.position(info, { ...report(1), phase: "BOARDING", onGround: true });
      board.position(info, report(2));
      await board.refreshPilots();
      expect(board.takeUpdate()?.events).toEqual([
        {
          at: report(1).at,
          flightId: info.flightId,
          callsign: "WMS101",
          kind: "started",
          airportIcao: "LFLL",
          arrivalIcao: "LFMN",
          touchdownVs: null,
          pilot: camille,
        },
      ]);
    });

    it("ignores events of a flight that is not on the map", () => {
      board.events(info.flightId, [touchdown]);
      expect(board.takeUpdate()).toBeNull();
    });

    it("keeps the latest events for a new spectator, newest first", () => {
      board.position(info, report(1));
      for (let i = 0; i < MAX_LIVE_EVENTS + 2; i += 1) {
        board.events(info.flightId, [{ ...touchdown, at: new Date(now + i * 1000).toISOString() }]);
      }
      board.takeUpdate();
      const latest = board.snapshot().events;
      expect(latest).toHaveLength(MAX_LIVE_EVENTS);
      expect(latest[0]?.at).toBe(new Date(now + (MAX_LIVE_EVENTS + 1) * 1000).toISOString());
    });
  });
});
