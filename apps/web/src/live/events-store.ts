import { type LiveEvent, MAX_LIVE_EVENTS } from "@weems/contrats";

/** Latest events of the live map, newest first. */
export type LiveEvents = readonly LiveEvent[];

/** The events of an update (oldest first) on top of the ones shown, MAX_LIVE_EVENTS at most. */
export function withNewEvents(current: LiveEvents, incoming: readonly LiveEvent[]): LiveEvents {
  if (incoming.length === 0) return current;
  return [...[...incoming].reverse(), ...current].slice(0, MAX_LIVE_EVENTS);
}
