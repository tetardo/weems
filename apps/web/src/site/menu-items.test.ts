import { describe, expect, it } from "vitest";
import { menuFor, navFor } from "./menu-items.ts";

const hrefs = (loggedIn: boolean) => menuFor(loggedIn).map((item) => item.href);

describe("menuFor", () => {
  it("shows Découvrir, Fonctionnalités and the open pages to a visitor", () => {
    expect(hrefs(false)).toEqual(["/discover", "/features", "/live", "/plans"]);
  });

  it("shows the pilot pages but not Découvrir nor Fonctionnalités to a logged-in pilot", () => {
    expect(hrefs(true)).toEqual(["/logbook", "/flights", "/live", "/plans"]);
  });

  it("keeps at most 5 entries for each audience (decision 003)", () => {
    expect(hrefs(false).length).toBeLessThanOrEqual(5);
    expect(hrefs(true).length).toBeLessThanOrEqual(5);
  });

  it("puts Vols en direct beside the way in on large screens, still in the phone menu", () => {
    expect(navFor(false).map((item) => item.href)).toEqual(["/discover", "/features", "/plans"]);
    expect(navFor(true).map((item) => item.href)).toEqual(["/logbook", "/flights", "/plans"]);
    expect(hrefs(false)).toContain("/live");
  });
});
