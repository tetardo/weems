import { z } from "zod";
import { FlightPhase } from "./phase.ts";

/**
 * Typed reading of a flight event's free `context`. The tracker writes these contexts
 * and the API and the site read them: one definition here, never a key read by hand.
 */
interface EventLike {
  type: string;
  context: Record<string, unknown>;
}

/** Context of a "phaseChanged" event. `airStart`: first phase of a flight opened in the air. */
export const PhaseChange = z.object({
  from: FlightPhase.nullable().default(null),
  to: FlightPhase,
  airStart: z.literal(true).optional(),
});
export type PhaseChange = z.infer<typeof PhaseChange>;

/** Context of a "touchdown" event: vertical speed at contact, ft/min (negative = descending). */
export const TouchdownContext = z.object({ vs: z.number() });
export type TouchdownContext = z.infer<typeof TouchdownContext>;

/** The phase change an event carries; null for another event or an unreadable context. */
export function phaseChangeOf(event: EventLike): PhaseChange | null {
  if (event.type !== "phaseChanged") return null;
  const parsed = PhaseChange.safeParse(event.context);
  return parsed.success ? parsed.data : null;
}

/** Touchdown vertical speed, ft/min; null for another event or when it was not measured. */
export function touchdownVsOf(event: EventLike): number | null {
  if (event.type !== "touchdown") return null;
  const parsed = TouchdownContext.safeParse(event.context);
  return parsed.success ? parsed.data.vs : null;
}
