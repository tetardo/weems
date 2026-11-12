import { describe, expect, it } from "vitest";
import { menuFor } from "./menu-items.ts";

const hrefs = (loggedIn: boolean) => menuFor(loggedIn).map((item) => item.href);

describe("menuFor", () => {
  it("shows Découvrir and the open pages to a visitor", () => {
    expect(hrefs(false)).toEqual(["/discover", "/live", "/plans"]);
  });

  it("shows the pilot pages but not Découvrir to a logged-in pilot", () => {
    expect(hrefs(true)).toEqual(["/logbook", "/flights", "/live", "/plans"]);
  });

  it("keeps at most 5 entries for each audience (decision 003)", () => {
    expect(hrefs(false).length).toBeLessThanOrEqual(5);
    expect(hrefs(true).length).toBeLessThanOrEqual(5);
  });
});
