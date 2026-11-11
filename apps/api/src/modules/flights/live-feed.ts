import type { LiveFlight, PositionReport } from "@weems/contrats";

/** Flight details shown on the live map, without the position. */
export type LiveFlightInfo = Omit<LiveFlight, "position" | "receivedAt" | "signal">;

/**
 * What the flights module tells the live map. Implemented by the live module;
 * the flights module only knows this interface.
 */
export interface LiveFeed {
  lastPosition(flightId: string): PositionReport | undefined;
  position(info: LiveFlightInfo, report: PositionReport): void;
  closed(flightId: string): void;
}
