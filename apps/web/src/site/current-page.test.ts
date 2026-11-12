import { describe, expect, it } from "vitest";
import { isCurrentPage } from "./current-page.ts";

describe("isCurrentPage", () => {
  it("highlights the page itself and its sub-pages", () => {
    expect(isCurrentPage("/flights", "/flights")).toBe(true);
    expect(isCurrentPage("/flights/0192f0a1", "/flights")).toBe(true);
  });

  it("does not highlight a page whose name only starts the same way", () => {
    expect(isCurrentPage("/flightsx", "/flights")).toBe(false);
    expect(isCurrentPage("/live", "/flights")).toBe(false);
  });
});
