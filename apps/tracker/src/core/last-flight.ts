/** Where a flight stands with the API: all accepted, still to send, or a message refused. */
export type Delivery = "sent" | "waiting" | "refused";

/** The last flight closed on this PC, for the tracker window (J3 flight report). */
export interface LastFlight {
  flightId: string;
  aircraftTitle: string;
  openedAt: string;
  closedAt: string;
  closeReason: string | null;
  /** Vertical speed at the last touchdown, ft/min (negative); null when it never touched down. */
  touchdownFpm: number | null;
  goArounds: number;
  bounces: number;
}
