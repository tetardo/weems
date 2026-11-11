import type { LiveFlight } from "@weems/contrats";

/** One appearance of a flight in the live stream. */
export interface Sighting {
  receivedAtMs: number;
  seq: number;
  signal: LiveFlight["signal"];
}

interface StreamEvent {
  event: string;
  data: unknown;
  receivedAtMs: number;
}

/** What a map would have shown, rebuilt from the recorded SSE events. */
export function observe(events: readonly StreamEvent[]) {
  const sightings = new Map<string, Sighting[]>();
  const removedAtMs = new Map<string, number>();
  const shown = new Set<string>();
  let mostShown = 0;
  for (const { event, data, receivedAtMs } of events) {
    if (event !== "snapshot" && event !== "update") continue;
    const { flights, removed = [] } = data as { flights: LiveFlight[]; removed?: string[] };
    for (const flight of flights) {
      const list = sightings.get(flight.flightId) ?? [];
      list.push({ receivedAtMs, seq: flight.position.seq, signal: flight.signal });
      sightings.set(flight.flightId, list);
      shown.add(flight.flightId);
    }
    for (const id of removed) {
      removedAtMs.set(id, receivedAtMs);
      shown.delete(id);
    }
    mostShown = Math.max(mostShown, shown.size);
  }
  return { sightings, removedAtMs, stillShown: [...shown], mostShown };
}

/** Longest real time between two appearances of a flight on the map. */
export function longestGapMs(list: readonly Sighting[]): number {
  let longest = 0;
  for (let i = 1; i < list.length; i++) {
    longest = Math.max(longest, (list[i]?.receivedAtMs ?? 0) - (list[i - 1]?.receivedAtMs ?? 0));
  }
  return longest;
}

/** Sequence numbers missing between 1 and the highest one received. */
export function missingSeqs(received: ReadonlySet<number>): number[] {
  const highest = Math.max(0, ...received);
  const missing: number[] = [];
  for (let seq = 1; seq <= highest; seq++) if (!received.has(seq)) missing.push(seq);
  return missing;
}
