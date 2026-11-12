import {
  type FlightEvent,
  type LiveEvent,
  type LivePilot,
  MAX_LIVE_EVENTS,
  phaseChangeOf,
  touchdownVsOf,
} from "@weems/contrats";
import type { LiveFlightInfo } from "../flights/live-feed.ts";

/** An event of the live map before its pilot is known: read when the stream takes it. */
interface Pending {
  info: LiveFlightInfo;
  at: string;
  kind: LiveEvent["kind"];
  touchdownVs: number | null;
}

/** What a flight event means on the live map, or null when it is not shown there. */
export function liveEventOf(event: FlightEvent): Omit<Pending, "info"> | null {
  const change = phaseChangeOf(event);
  if (change?.from === "TAKEOFF" && change.to === "CLIMB") {
    return { at: event.at, kind: "takeoff", touchdownVs: null };
  }
  if (event.type !== "touchdown") return null;
  return { at: event.at, kind: "landing", touchdownVs: touchdownVsOf(event) };
}

/**
 * Latest events of the live map (spec J4, carte en direct): collected as they arrive, given to
 * the stream with each update, the last MAX_LIVE_EVENTS kept for the snapshot of a new spectator.
 */
export class LiveEvents {
  private pending: Pending[] = [];
  /** Newest first. */
  private recent: LiveEvent[] = [];

  add(info: LiveFlightInfo, event: Omit<Pending, "info">): void {
    this.pending.push({ info, ...event });
  }

  /**
   * Events since the last call, oldest first, with each pilot as now known. A private pilot's
   * start is dropped: only the callsign of their take-offs and landings is shown, as on the map.
   */
  take(pilotOf: (pilotId: string) => LivePilot | null): LiveEvent[] {
    const taken = this.pending.flatMap(({ info, ...event }) => {
      const pilot = pilotOf(info.pilotId);
      if (event.kind === "started" && !pilot) return [];
      const airportIcao = event.kind === "landing" ? info.plannedArrivalIcao : info.departureIcao;
      const arrivalIcao = event.kind === "started" ? info.plannedArrivalIcao : null;
      return [
        {
          ...event,
          flightId: info.flightId,
          callsign: info.callsign,
          airportIcao,
          arrivalIcao,
          pilot,
        },
      ];
    });
    this.pending = [];
    this.recent = [...[...taken].reverse(), ...this.recent].slice(0, MAX_LIVE_EVENTS);
    return taken;
  }

  /** The latest events, newest first. */
  latest(): LiveEvent[] {
    return [...this.recent];
  }
}
