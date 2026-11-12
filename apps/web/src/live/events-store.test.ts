import { type LiveEvent, MAX_LIVE_EVENTS } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { withNewEvents } from "./events-store.ts";

const event = (at: string): LiveEvent => ({
  at,
  flightId: "0197a000-0000-7000-8000-000000000001",
  callsign: "WMS101",
  kind: "takeoff",
  airportIcao: "LFLL",
  arrivalIcao: null,
  touchdownVs: null,
  pilot: null,
});

describe("latest events of the live map", () => {
  it("puts the newest on top and keeps the latest only", () => {
    const shown = Array.from({ length: MAX_LIVE_EVENTS }, (_, i) => event(`old-${i}`));
    const next = withNewEvents(shown, [event("new-1"), event("new-2")]);
    expect(next.map((e) => e.at).slice(0, 3)).toEqual(["new-2", "new-1", "old-0"]);
    expect(next).toHaveLength(MAX_LIVE_EVENTS);
  });

  it("keeps the same list when nothing happened", () => {
    const shown = [event("a")];
    expect(withNewEvents(shown, [])).toBe(shown);
  });
});
