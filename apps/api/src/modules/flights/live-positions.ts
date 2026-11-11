import type { PositionReport } from "@weems/contrats";

/**
 * Last known position of each open flight. Kept in memory on purpose
 * (architecture, step 2): it is only for the live map, and is rebuilt within seconds
 * after a restart because trackers send a position every 5 to 15 s.
 */
export class LivePositions {
  private readonly latest = new Map<string, PositionReport>();

  get(flightId: string): PositionReport | undefined {
    return this.latest.get(flightId);
  }

  set(flightId: string, position: PositionReport): void {
    this.latest.set(flightId, position);
  }

  delete(flightId: string): void {
    this.latest.delete(flightId);
  }
}
