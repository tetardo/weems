import type { FlightEvent } from "@weems/contrats";

/** Phases have their own timeline: the log keeps everything else (spec site minimal, log). */
export function logEntries(events: readonly FlightEvent[]): FlightEvent[] {
  return events.filter((event) => event.type !== "phaseChanged");
}

/** Values used by the translated sentence of an event (Events.* messages). */
export function eventValues(event: FlightEvent): Record<string, string | number> {
  const { context } = event;
  if (event.type === "touchdown" && typeof context["vs"] === "number") {
    return { vs: Math.round(context["vs"]) };
  }
  if (event.type === "simRateChanged") return { rate: Number(context["to"] ?? 1) };
  if (event.type === "slew") return { state: context["active"] === true ? "on" : "off" };
  return {};
}
