import type { HomeImage } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { changesOf, draftOf, missingLabels, planOf } from "./plan.ts";

const image: HomeImage = {
  path: "/v1/site/home-images/light/image?v=1",
  focus: "left",
  credit: "Image maison Weems",
  licence: "Tous droits réservés",
  width: 2560,
  height: 1440,
  updatedAt: "2026-11-12T02:00:00.000Z",
};
const empty = { light: null, dark: null };

describe("planOf", () => {
  it("does nothing while nothing changed", () => {
    const current = { light: image, dark: null };
    const plan = planOf({ light: draftOf(image), dark: draftOf(null) }, current, false);
    expect(plan).toEqual({ light: "none", dark: "none" });
    expect(changesOf(plan)).toBe(0);
  });

  it("uploads a new file, updates changed settings, resets on demand", () => {
    const drafts = {
      light: { ...draftOf(image), focus: "right" as const },
      dark: { ...draftOf(null), file: "jet.jpg" },
    };
    expect(planOf(drafts, { light: image, dark: null }, false)).toEqual({
      light: "update",
      dark: "upload",
    });
    const reset = { light: { ...draftOf(image), reset: true }, dark: draftOf(null) };
    expect(planOf(reset, { light: image, dark: null }, false).light).toBe("reset");
  });

  it("gives the dark theme the light one's image when both share it", () => {
    const withFile = { light: { ...draftOf(null), file: "jet.jpg" }, dark: draftOf(null) };
    expect(planOf(withFile, empty, true)).toEqual({ light: "upload", dark: "upload" });
    const kept = { light: draftOf(image), dark: draftOf(null) };
    expect(planOf(kept, { light: image, dark: null }, true)).toEqual({
      light: "none",
      dark: "copy",
    });
    const none = { light: draftOf(null), dark: draftOf(image) };
    expect(planOf(none, { light: null, dark: image }, true)).toEqual({
      light: "none",
      dark: "reset",
    });
  });
});

describe("missingLabels", () => {
  it("asks for credit and licence only when the theme shows an image", () => {
    expect(missingLabels(draftOf(null), null)).toBe(false);
    expect(missingLabels({ ...draftOf(null), file: "jet.jpg" }, null)).toBe(true);
    expect(missingLabels(draftOf(image), image)).toBe(false);
    expect(missingLabels({ ...draftOf(image), credit: " " }, image)).toBe(true);
  });
});
