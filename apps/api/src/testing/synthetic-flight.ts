import {
  type CloseFlightRequest,
  type FlightEvent,
  type OpenFlightRequest,
  type PositionReport,
  uuidV7,
} from "@weems/contrats";

/** A short complete flight, as the tracker core would send it. Fresh id on each call. */
export function syntheticFlight() {
  const open: OpenFlightRequest = {
    flightId: uuidV7(),
    callsign: "WMS123",
    aircraft: {
      simulator: "replay",
      title: "Airbus A320neo",
      model: "A20N",
      registration: "F-WEMS",
      engineCount: 2,
      emptyWeightKg: 44300,
    },
    departureIcao: "LFPG",
    plannedArrivalIcao: "LFBO",
    openedAt: "2026-11-11T08:00:00.000Z",
    trackerVersion: "0.1.0",
  };
  const phases = ["PUSHBACK", "TAXI_OUT", "TAKEOFF", "CLIMB", "CRUISE"] as const;
  const events: FlightEvent[] = phases.map((to, i) => ({
    seq: i + 1,
    at: `2026-11-11T08:${String(5 + i * 5).padStart(2, "0")}:00.000Z`,
    type: "phaseChanged",
    context: { from: i === 0 ? "BOARDING" : phases[i - 1], to },
  }));
  events.push({
    seq: 6,
    at: "2026-11-11T09:10:30.250Z",
    type: "touchdown",
    context: { vs: -142.5 },
  });
  const position: PositionReport = {
    seq: 1,
    at: "2026-11-11T08:40:00.000Z",
    lat: 46.2,
    lon: 1.9,
    altMsl: 36000,
    gs: 450,
    heading: 195,
    vs: 0,
    phase: "CRUISE",
    onGround: false,
  };
  const close: CloseFlightRequest = { closedAt: "2026-11-11T09:30:00.000Z", reason: "normal" };
  return { open, events, position, close };
}
