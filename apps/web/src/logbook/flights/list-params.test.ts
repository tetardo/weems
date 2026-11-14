import { describe, expect, it } from "vitest";
import { listHref, listParamsOf, sortHref } from "./list-params.ts";

describe("state of the page Vols", () => {
  it("reads the address, falling back on the defaults", () => {
    expect(listParamsOf({})).toEqual({
      q: "",
      filter: "all",
      sort: "date",
      order: "desc",
      shown: 50,
    });
    expect(
      listParamsOf({ q: " lfml ", f: "review", sort: "block", order: "asc", n: "120" }),
    ).toEqual({ q: "lfml", filter: "review", sort: "block", order: "asc", shown: 150 });
    expect(listParamsOf({ f: "other", sort: "speed", n: "-3" })).toMatchObject({
      filter: "all",
      sort: "date",
      shown: 50,
    });
    expect(listParamsOf({ n: "99999" }).shown).toBe(1000);
  });

  it("writes only what differs from the defaults", () => {
    const params = listParamsOf({});
    expect(listHref(params)).toBe("/logbook/flights");
    expect(listHref(params, { filter: "clean", q: "A320" })).toBe(
      "/logbook/flights?q=A320&f=clean",
    );
    expect(listHref(params, { shown: 100 })).toBe("/logbook/flights?n=100");
  });

  it("sorts a new column first, then inverts it", () => {
    const params = listParamsOf({});
    expect(sortHref(params, "date")).toBe("/logbook/flights?sort=date&order=asc");
    expect(sortHref(params, "touchdown")).toBe("/logbook/flights?sort=touchdown&order=asc");
    expect(sortHref({ ...params, sort: "touchdown", order: "asc" }, "touchdown")).toBe(
      "/logbook/flights?sort=touchdown&order=desc",
    );
  });
});
