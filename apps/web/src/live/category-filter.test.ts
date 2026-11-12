import { describe, expect, it } from "vitest";
import { categoryCounts, visibleFlights } from "./category-filter.ts";
import type { LiveFlights } from "./flights-store.ts";
import { liveFlight } from "./testing/live-flight.ts";

const flights: LiveFlights = new Map(
  [
    liveFlight("a"),
    liveFlight("b"),
    liveFlight("c", { aircraftClass: { category: "light", estimated: false } }),
    liveFlight("d", { aircraftClass: null }),
  ].map((flight) => [flight.flightId, flight]),
);

describe("category filters of the live map", () => {
  it("counts the flights of each category, in the legend's order", () => {
    expect(categoryCounts(flights)).toEqual([
      ["light", 1],
      ["narrowBody", 2],
      ["other", 1],
    ]);
  });

  it("hides the flights of the hidden categories, an unknown one as « other »", () => {
    expect([...visibleFlights(flights, new Set(["narrowBody", "other"])).keys()]).toEqual(["c"]);
  });

  it("keeps the same map when nothing is hidden", () => {
    expect(visibleFlights(flights, new Set())).toBe(flights);
  });
});
