import type { FlightEvent, LogbookEntry, TrackView } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { aircraftComparison } from "./aircraft-comparison.ts";
import { approachGeometry, approachPoints } from "./approach-geometry.ts";
import { landingDetails } from "./landing-details.ts";

type TrackPoint = TrackView["points"][number];

const at = (s: number) => new Date(Date.UTC(2026, 10, 12, 19, 0, s)).toISOString();

function point(s: number, altAgl: number, vs: number, ias = 140): TrackPoint {
  return {
    at: at(s),
    lat: 43.6,
    lon: 7.2,
    altMsl: altAgl,
    altAgl,
    ias,
    gs: ias,
    vs,
    heading: 40,
    onGround: altAgl === 0,
    phase: "FINAL",
  };
}

function entry(
  id: string,
  model: string,
  touchdownVs: number | null,
  blockS: number,
): LogbookEntry {
  return {
    flight: {
      flightId: id,
      callsign: "WMS1",
      aircraftTitle: model,
      aircraftModel: model,
      aircraftClass: null,
      departureIcao: "LFPG",
      plannedArrivalIcao: "LFMN",
      openedAt: at(0),
      closedAt: at(60),
      closeReason: null,
      times: { blockS, airborneS: null, pausedS: 0 },
      alerts: [],
    },
    touchdownVs,
    bounces: 0,
    goArounds: 0,
    verdict: "clean",
  };
}

const event = (seq: number, s: number, type: FlightEvent["type"], context = {}): FlightEvent => ({
  seq,
  at: at(s),
  type,
  context,
});

describe("full flight page", () => {
  it("keeps the three minutes before the touchdown and fills the chart width", () => {
    const points = [point(0, 3000, -800), point(100, 1500, -700), point(250, 0, -150)];
    expect(approachPoints(points, at(250)).map((p) => p.altAgl)).toEqual([1500, 0]);
    const shape = approachGeometry(points, at(250), {
      width: 1000,
      heightBand: [0, 100],
      sinkBand: [120, 220],
    });
    expect(shape?.topAgl).toBe(1500);
    expect(shape?.heightLine).toBe("M166.7,0.0L1000.0,100.0");
    expect(
      approachGeometry(points.slice(2), at(250), {
        width: 1,
        heightBand: [0, 1],
        sinkBand: [1, 2],
      }),
    ).toBeNull();
  });

  it("details the final landing with the speed of the nearest point", () => {
    const events = [
      event(1, 240, "touchdown", { vs: -400 }),
      event(2, 241, "goAround"),
      event(3, 250, "touchdown", { vs: -142 }),
    ];
    const landing = landingDetails(
      events,
      [point(200, 500, -700, 150), point(249, 0, -140, 134)],
      null,
    );
    expect(landing).toMatchObject({
      touchdownVs: -142,
      at: at(250),
      ias: 134,
      gForce: null,
      goArounds: 1,
    });
    expect(landingDetails([], [], null)).toBeNull();
  });

  it("ranks the touchdown among the flights on the same aircraft", () => {
    const mine = entry("a", "A20N", -142, 5000);
    const other = entry("d", "B738", -50, 1);
    const all = [mine, entry("b", "A20N", -100, 6000), entry("c", "A20N", -300, 4000), other];
    expect(aircraftComparison(mine, all)).toMatchObject({
      aircraft: "A20N",
      flights: 3,
      touchdownRank: 2,
      touchdown: { value: 142, max: 300 },
      block: { mean: 5000 },
    });
    expect(aircraftComparison(other, all)).toBeNull();
  });
});
