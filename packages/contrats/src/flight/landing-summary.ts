import type { FlightEvent } from "../api/flights.ts";
import { touchdownVsOf } from "./event-context.ts";

export interface LandingSummary {
  /** Vertical speed of the first touchdown of the final landing, ft/min; null if not measured. */
  touchdownVs: number | null;
  /** Time of that touchdown. */
  at: string;
  bounces: number;
  touchdowns: number;
  goArounds: number;
}

const RESTARTS = new Set(["goAround", "touchAndGo"]);

/**
 * The final landing: what follows the last go-around or touch-and-go.
 * Null when the flight never touched down.
 */
export function landingSummary(events: readonly FlightEvent[]): LandingSummary | null {
  const lastRestart = events.findLastIndex((e) => RESTARTS.has(e.type));
  const final = events.slice(lastRestart + 1);
  const touchdown = final.find((e) => e.type === "touchdown");
  if (!touchdown) return null;
  return {
    touchdownVs: touchdownVsOf(touchdown),
    at: touchdown.at,
    bounces: final.filter((e) => e.type === "bounce").length,
    touchdowns: events.filter((e) => e.type === "touchdown").length,
    goArounds: events.filter((e) => e.type === "goAround").length,
  };
}
