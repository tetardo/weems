import { AircraftCategory } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { iconNameOf, iconNames } from "./aircraft-shapes.ts";

describe("aircraft silhouettes of the live map", () => {
  it("has an image for every category, signal ok or lost, and for unknown aircraft", () => {
    const names = new Set(iconNames().map((icon) => icon.name));
    for (const category of [...AircraftCategory.options, null]) {
      expect(names).toContain(iconNameOf(category, false));
      expect(names).toContain(iconNameOf(category, true));
    }
  });

  it("colours by category, and greys a lost aircraft with the silhouette of its family", () => {
    expect(iconNameOf("helicopter", false)).toBe("aircraft-helicopter");
    expect(iconNameOf("helicopter", true)).toBe("aircraft-lost-helicopter");
    expect(iconNameOf("regionalJet", true)).toBe(iconNameOf("wideBody", true));
  });
});
