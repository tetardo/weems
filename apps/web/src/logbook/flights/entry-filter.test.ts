import type { LandingVerdict, LogbookEntry } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { entryFilterOf, filterEntries, flightsHref } from "./entry-filter.ts";

const entry = (verdict: LandingVerdict) => ({ verdict }) as LogbookEntry;
const ALL = (["clean", "firm", "bounce", "nonCompliant", "noLanding"] as const).map(entry);

describe("filters of the page Vols", () => {
  it("keeps the clean flights, or the ones to review", () => {
    expect(filterEntries(ALL, "clean").map((e) => e.verdict)).toEqual(["clean"]);
    expect(filterEntries(ALL, "review").map((e) => e.verdict)).toEqual([
      "firm",
      "bounce",
      "nonCompliant",
    ]);
    expect(filterEntries(ALL, "all")).toHaveLength(5);
  });

  it("reads the filter from the address and keeps it in the links", () => {
    expect(entryFilterOf("review")).toBe("review");
    expect(entryFilterOf("other")).toBe("all");
    expect(flightsHref("all", "x")).toBe("/logbook/flights/x");
    expect(flightsHref("clean", "x")).toBe("/logbook/flights/x?f=clean");
  });
});
