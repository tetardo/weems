import { describe, expect, it } from "vitest";
import { readFilters, toApiQuery, withoutCursor } from "./list-query.ts";

describe("flight list filters", () => {
  it("reads valid filters from the address", () => {
    expect(
      readFilters({
        from: "2026-11-01",
        to: "2026-11-11",
        aircraft: " A320 ",
        airport: "lfpg",
        cursor: "abc",
      }),
    ).toEqual({
      from: "2026-11-01",
      to: "2026-11-11",
      aircraft: "A320",
      airport: "LFPG",
      cursor: "abc",
    });
  });

  it("ignores empty and malformed values instead of sending them", () => {
    expect(
      readFilters({ from: "", to: "11/11/2026", airport: "PARIS", aircraft: ["", "x"] }),
    ).toEqual({});
  });

  it("asks the API for whole UTC days, 50 flights per page", () => {
    const query = toApiQuery({ from: "2026-11-01", to: "2026-11-11", airport: "LFBO" });
    expect(Object.fromEntries(query)).toEqual({
      limit: "50",
      from: "2026-11-01T00:00:00.000Z",
      to: "2026-11-12T00:00:00.000Z",
      airport: "LFBO",
    });
  });

  it("drops the page position, keeps the rest", () => {
    expect(withoutCursor({ airport: "LFBO", cursor: "abc" })).toEqual({ airport: "LFBO" });
  });
});
