import type { LiveFlight } from "@weems/contrats";

/** A live flight for tests, with overridable fields. */
export function liveFlight(flightId: string, overrides: Partial<LiveFlight> = {}): LiveFlight {
  return {
    flightId,
    callsign: "WMS101",
    aircraftTitle: "Airbus A320neo",
    aircraftModel: "A20N",
    aircraftClass: { category: "narrowBody", estimated: false },
    departureIcao: "LFLL",
    plannedArrivalIcao: "LFMN",
    position: {
      seq: 1,
      at: "2026-11-11T08:00:00.000Z",
      lat: 45,
      lon: 5,
      altMsl: 35000,
      gs: 450,
      heading: 90,
      vs: 0,
      onGround: false,
      phase: "CRUISE",
    },
    receivedAt: "2026-11-11T08:00:00.100Z",
    signal: "ok",
    fictitious: false,
    pilot: null,
    ...overrides,
  };
}
