import { describe, expect, it } from "vitest";
import { mapTheme } from "./map-theme.ts";

describe("map theme", () => {
  it("uses the dark basemap and light ink in the dark theme", () => {
    const theme = mapTheme(true);
    expect(theme.styleUrl).toMatch(/\/dark$/);
    expect(theme.ink).toBe("#e8ecf5");
  });

  it("uses the positron basemap and dark ink in the light theme", () => {
    const theme = mapTheme(false);
    expect(theme.styleUrl).toMatch(/\/positron$/);
    expect(theme.ink).toBe("#1f2430");
  });
});
