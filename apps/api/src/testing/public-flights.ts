import type { AircraftCategory, FlightEvent, TrackPoint } from "@weems/contrats";
import type { SummaryWithEvents } from "../modules/flights/service.ts";

let counter = 0;

/** Options of a closed flight made for the profile statistics tests. */
export interface PublicFlightOptions {
  model?: string;
  dep?: string;
  arr?: string;
  blockS?: number | null;
  /** Final touchdown vertical speed; null: touchdown not measured. */
  vs?: number | null;
  /** false: the flight never touched down. */
  landed?: boolean;
  /** Opening time; the takeoff event, if any, is at the same time. */
  at?: string;
  /** Other events, before the touchdown. */
  extra?: FlightEvent["type"][];
  takeoff?: boolean;
  /** Aircraft category (not estimated); null: not classified. */
  category?: AircraftCategory | null;
  engines?: number;
}

const DEFAULTS = {
  model: "A20N",
  dep: "LFPG",
  arr: "LFBO",
  blockS: 3600,
  vs: -150,
  at: "2026-11-11T09:00:00.000Z",
  extra: [],
  takeoff: false,
  landed: true,
  category: null,
  engines: 2,
};

/** Events of the flight: takeoff, the extra ones, the final touchdown. */
function eventsOf({
  at,
  extra,
  takeoff,
  landed,
  vs,
}: Required<PublicFlightOptions>): FlightEvent[] {
  const events: FlightEvent[] = extra.map((type, i) => ({ seq: i + 2, at, type, context: {} }));
  if (takeoff)
    events.unshift({
      seq: 1,
      at,
      type: "phaseChanged",
      context: { from: "TAXI_OUT", to: "TAKEOFF" },
    });
  if (landed) events.push({ seq: 99, at, type: "touchdown", context: vs === null ? {} : { vs } });
  return events;
}

/** A closed flight with its events, as the flights service gives it to the profile. */
export function publicFlight(options: PublicFlightOptions = {}): SummaryWithEvents {
  const all: Required<PublicFlightOptions> = { ...DEFAULTS, ...options };
  const { model, dep, arr, blockS, at, category } = all;
  const flightId = `01970000-0000-7000-8000-${String(++counter).padStart(12, "0")}`;
  return {
    summary: {
      flightId,
      callsign: "WMS1",
      aircraftTitle: `Title ${model}`,
      aircraftModel: model,
      aircraftClass: category === null ? null : { category, estimated: false },
      departureIcao: dep,
      plannedArrivalIcao: arr,
      openedAt: at,
      closedAt: at,
      closeReason: "normal",
      times: { blockS, airborneS: blockS === null ? null : blockS - 600, pausedS: 0 },
      alerts: [],
    },
    events: eventsOf(all),
    engineCount: all.engines,
    simulator: "msfs2024",
  };
}

/** A trajectory point, airborne at 5000 ft unless told otherwise. */
export function trackPoint(over: Partial<TrackPoint> = {}): TrackPoint {
  return {
    at: "2026-11-11T09:00:00.000Z",
    lat: 48.86,
    lon: 2.35,
    altMsl: 5000,
    altAgl: 5000,
    ias: 200,
    gs: 200,
    vs: 0,
    heading: 0,
    onGround: false,
    ...over,
  };
}
