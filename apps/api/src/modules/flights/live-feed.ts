import type { LiveFlight, PositionReport } from "@weems/contrats";

/**
 * Flight details shown on the live map, without the position; with the pilot's id, which the
 * live module uses to show the pilot only when their profile is public (never sent as is).
 */
export type LiveFlightInfo = Omit<LiveFlight, "position" | "receivedAt" | "signal" | "pilot"> & {
  pilotId: string;
};

/**
 * What the flights module tells the live map. Implemented by the live module;
 * the flights module only knows this interface.
 */
export interface LiveFeed {
  lastPosition(flightId: string): PositionReport | undefined;
  position(info: LiveFlightInfo, report: PositionReport): void;
  closed(flightId: string): void;
}
