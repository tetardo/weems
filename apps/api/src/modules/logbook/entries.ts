import {
  landingSummary,
  TOUCHDOWN_BUCKETS_FPM,
  type LandingVerdict,
  type LogbookEntry,
} from "@weems/contrats";
import type { SummaryWithEvents } from "../flights/service.ts";

/** From this vertical speed on, a touchdown is firm (the « normal » bucket ends here). */
const FIRM_FROM_FPM = TOUCHDOWN_BUCKETS_FPM[1];

function verdictOf(alerts: number, landing: ReturnType<typeof landingSummary>): LandingVerdict {
  if (alerts > 0) return "nonCompliant";
  if (!landing) return "noLanding";
  if (landing.bounces > 0) return "bounce";
  const vs = landing.touchdownVs;
  return vs !== null && Math.abs(vs) >= FIRM_FROM_FPM ? "firm" : "clean";
}

/** A line of the page Vols: the flight, its final landing and its verdict. */
export function logbookEntry({ summary, events }: SummaryWithEvents): LogbookEntry {
  const landing = landingSummary(events);
  return {
    flight: summary,
    touchdownVs: landing?.touchdownVs ?? null,
    bounces: landing?.bounces ?? 0,
    goArounds: landing?.goArounds ?? 0,
    verdict: verdictOf(summary.alerts.length, landing),
  };
}
