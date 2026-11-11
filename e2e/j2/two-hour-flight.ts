import { type FlightEvent, type FlightPhase, type TrackPoint, uuidV7 } from "@weems/contrats";
import { TRACKER_HEADERS } from "../../apps/api/src/testing/test-app.ts";

const START_MS = Date.parse("2026-11-11T08:00:00.000Z");
const SECONDS = 7_200;
const at = (s: number) => new Date(START_MS + s * 1000).toISOString();

/** Phase starts of the 2-hour flight, in seconds. */
const PHASES: [number, FlightPhase][] = [
  [0, "BOARDING"],
  [300, "TAXI_OUT"],
  [900, "TAKEOFF"],
  [960, "CLIMB"],
  [2_400, "CRUISE"],
  [5_400, "DESCENT"],
  [6_600, "APPROACH"],
  [6_900, "FINAL"],
  [7_050, "LANDING"],
  [7_100, "TAXI_IN"],
  [7_199, "ARRIVED"],
];

function altitudeAt(s: number): number {
  if (s < 960 || s > 7_050) return 0;
  return s < 5_400 ? Math.min(36_000, (s - 960) * 25) : Math.max(0, 36_000 - (s - 5_400) * 21);
}

/**
 * Worst case for the simplification: one point per second for 2 hours, wiggling sideways
 * and vertically, so that hundreds of points must be kept.
 */
function wigglingTrack(): TrackPoint[] {
  return Array.from({ length: SECONDS }, (_, s) => {
    const altAgl = altitudeAt(s);
    return {
      at: at(s),
      lat: 49 - s * 0.0011 + 0.02 * Math.sin(s / 40),
      lon: 2.5 - s * 0.0003 + 0.02 * Math.cos(s / 55),
      altMsl: 400 + altAgl + (altAgl > 0 ? 300 * Math.sin(s / 30) : 0),
      altAgl,
      ias: s < 300 ? 0 : 250,
      gs: s < 300 ? 0 : altAgl > 0 ? 450 : 20,
      vs: 0,
      heading: 200,
      onGround: altAgl === 0,
    };
  });
}

async function post(baseUrl: string, path: string, body: unknown): Promise<void> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { ...TRACKER_HEADERS, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (response.status !== 201) throw new Error(`${path}: HTTP ${response.status}`);
}

/** Sends a complete 2-hour flight to the API, as the tracker would. Returns its id. */
export async function sendTwoHourFlight(baseUrl: string): Promise<string> {
  const flightId = uuidV7(START_MS);
  await post(baseUrl, "/v1/flights", {
    flightId,
    callsign: "WMS2H",
    aircraft: {
      simulator: "msfs2024",
      title: "Airbus A320neo",
      model: "A20N",
      registration: null,
      engineCount: 2,
      emptyWeightKg: 42_600,
    },
    departureIcao: "LFPG",
    plannedArrivalIcao: "LEMD",
    openedAt: at(0),
    trackerVersion: "0.1.0",
  });
  const events: FlightEvent[] = PHASES.map(([s, to], i) => ({
    seq: i + 1,
    at: at(s),
    type: "phaseChanged",
    context: { from: PHASES[i - 1]?.[1] ?? null, to },
  }));
  await post(baseUrl, `/v1/flights/${flightId}/events`, { events });
  await post(baseUrl, `/v1/flights/${flightId}/close`, { closedAt: at(SECONDS), reason: "normal" });
  await post(baseUrl, `/v1/flights/${flightId}/track`, { points: wigglingTrack() });
  return flightId;
}

export const TWO_HOUR_PHASES = PHASES.map(([, phase]) => phase);
