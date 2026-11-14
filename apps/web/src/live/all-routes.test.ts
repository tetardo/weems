import { describe, expect, it } from "vitest";
import { type Airports, missingCodes, withAnswer } from "./airport-book.ts";
import { allRouteLines } from "./all-routes.ts";
import { fromSnapshot } from "./flights-store.ts";
import { liveFlight } from "./testing/live-flight.ts";
import { testAirport } from "./testing/airport.ts";

const LFLL = testAirport("LFLL", "Lyon", 45.726, 5.0901);
const LFMN = testAirport("LFMN", "Nice", 43.6584, 7.2159);
const airports: Airports = new Map([
  ["LFLL", LFLL],
  ["LFMN", LFMN],
  ["ZZZZ", null],
]);
const kinds = (flights: Parameters<typeof allRouteLines>[0], selected: string | null = null) =>
  allRouteLines(flights, airports, selected).features.map(
    (feature) => (feature.properties as { kind: string }).kind,
  );

describe("airport book", () => {
  it("asks only for the codes not known yet, once each", () => {
    const flights = fromSnapshot({
      flights: [
        liveFlight("a"),
        liveFlight("b", { departureIcao: "LFPG", plannedArrivalIcao: null }),
        liveFlight("c", { departureIcao: "LFPG", plannedArrivalIcao: "ZZZZ" }),
      ],
    });
    expect(missingCodes(flights, airports)).toEqual([["LFPG"]]);
  });

  it("asks in batches of 100 codes", () => {
    const flights = fromSnapshot({
      flights: Array.from({ length: 150 }, (_, i) =>
        liveFlight(`f${i}`, { departureIcao: `A${String(i).padStart(3, "0")}` }),
      ),
    });
    expect(missingCodes(flights, airports).map((batch) => batch.length)).toEqual([100, 50]);
  });

  it("remembers the codes the API did not return as unknown", () => {
    const next = withAnswer(new Map(), ["LFLL", "QQQQ"], [LFLL]);
    expect([...next]).toEqual([
      ["LFLL", LFLL],
      ["QQQQ", null],
    ]);
  });
});

describe("all routes", () => {
  it("draws flown and ahead halves for each flight, from departure through the aircraft", () => {
    const lines = allRouteLines(fromSnapshot({ flights: [liveFlight("a")] }), airports, null);
    const [flown, ahead] = lines.features.map((feature) => feature.geometry.coordinates);
    expect(flown?.[0]?.[0]).toBeCloseTo(LFLL.lon);
    expect(flown?.at(-1)).toEqual([5, 45]);
    expect(ahead?.[0]).toEqual([5, 45]);
    expect(ahead?.at(-1)?.[1]).toBeCloseTo(LFMN.lat);
  });

  it("leaves out the selected flight and the halves of unknown airports", () => {
    const flights = fromSnapshot({
      flights: [
        liveFlight("a"),
        liveFlight("b", { plannedArrivalIcao: "ZZZZ" }),
        liveFlight("c", { departureIcao: null }),
      ],
    });
    expect(kinds(flights, "a")).toEqual(["flown", "ahead"]);
  });
});
