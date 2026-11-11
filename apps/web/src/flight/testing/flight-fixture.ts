import type { FlightEvent, FlightPhase, TrackView } from "@weems/contrats";

let seq = 0;

/** A flight event at `minute` past 08:00 UTC. Tests only. */
export function event(
  minute: number,
  type: FlightEvent["type"],
  context: Record<string, unknown> = {},
): FlightEvent {
  const at = new Date(Date.UTC(2026, 10, 11, 8, minute)).toISOString();
  return { seq: ++seq, at, type, context };
}

export const phase = (minute: number, to: FlightPhase) => event(minute, "phaseChanged", { to });

/** A track point at `minute` past 08:00 UTC. Tests only. */
export function point(
  minute: number,
  phaseValue: FlightPhase | null,
  altMsl = 0,
  gs = 0,
): TrackView["points"][number] {
  return {
    at: new Date(Date.UTC(2026, 10, 11, 8, minute)).toISOString(),
    lat: 45 + minute / 100,
    lon: 1 + minute / 100,
    altMsl,
    altAgl: altMsl,
    ias: gs,
    gs,
    vs: 0,
    heading: 180,
    onGround: altMsl === 0,
    phase: phaseValue,
  };
}
