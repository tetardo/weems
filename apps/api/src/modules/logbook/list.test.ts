import { LogbookListQuery } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { publicFlight } from "../../testing/public-flights.ts";
import { logbookEntry } from "./entries.ts";
import { logbookList } from "./list.ts";

const NAMES: Record<string, string> = { LFML: "Marseille Provence Airport" };
const airportName = (icao: string | null) => (icao && NAMES[icao]) || null;
const query = (raw: Record<string, unknown> = {}) => LogbookListQuery.parse(raw);

/** Newest first, as the flights service gives them. */
const ENTRIES = [
  publicFlight({ at: "2026-11-14T10:00:00.000Z", dep: "LFML", vs: -120, blockS: 3000 }),
  publicFlight({ at: "2026-11-13T10:00:00.000Z", model: "C172", vs: -320, blockS: null }),
  publicFlight({ at: "2026-11-12T10:00:00.000Z", landed: false, blockS: 9000 }),
  publicFlight({ at: "2026-11-11T10:00:00.000Z", vs: -60, blockS: 1200 }),
].map(logbookEntry);
const dates = (list: ReturnType<typeof logbookList>) =>
  list.entries.map((e) => e.flight.openedAt.slice(8, 10));

describe("list of the page Vols", () => {
  it("gives the airport names and counts every flight", () => {
    const list = logbookList(ENTRIES, query(), airportName);
    expect(list.entries[0]).toMatchObject({
      departureName: "Marseille Provence Airport",
      arrivalName: null,
    });
    expect(list).toMatchObject({ matching: 4, total: 4, nextOffset: null });
  });

  it("searches codes, airport names and aircraft, any case", () => {
    expect(dates(logbookList(ENTRIES, query({ q: "marseille" }), airportName))).toEqual(["14"]);
    expect(dates(logbookList(ENTRIES, query({ q: "c172" }), airportName))).toEqual(["13"]);
    expect(logbookList(ENTRIES, query({ q: "lfpg" }), airportName).matching).toBe(3);
  });

  it("filters clean flights and flights to review", () => {
    expect(dates(logbookList(ENTRIES, query({ filter: "clean" }), airportName))).toEqual([
      "14",
      "11",
    ]);
    expect(dates(logbookList(ENTRIES, query({ filter: "review" }), airportName))).toEqual(["13"]);
  });

  it("sorts by block time or touchdown, unmeasured last in both orders", () => {
    const block = (order: string) =>
      dates(logbookList(ENTRIES, query({ sort: "block", order }), airportName));
    expect(block("asc")).toEqual(["11", "14", "12", "13"]);
    expect(block("desc")).toEqual(["12", "14", "11", "13"]);
    const soft = logbookList(ENTRIES, query({ sort: "touchdown", order: "asc" }), airportName);
    expect(dates(soft)).toEqual(["11", "14", "13", "12"]);
  });

  it("reads a slice and says where the next one starts", () => {
    const first = logbookList(ENTRIES, query({ limit: 3 }), airportName);
    expect(first).toMatchObject({ matching: 4, nextOffset: 3 });
    expect(dates(logbookList(ENTRIES, query({ offset: 3, limit: 3 }), airportName))).toEqual([
      "11",
    ]);
  });
});
