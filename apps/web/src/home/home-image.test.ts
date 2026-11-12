import type { HomeImage } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { homeBackgrounds } from "./home-image.ts";

const uploaded: HomeImage = {
  path: "/v1/site/home-images/dark/image?v=1",
  focus: "right",
  credit: "Image maison Weems",
  licence: "Tous droits réservés",
  width: 2560,
  height: 1440,
  updatedAt: "2026-11-12T02:00:00.000Z",
};

describe("homeBackgrounds", () => {
  it("falls back on the image shipped with the site", () => {
    const backgrounds = homeBackgrounds(null, "http://api.test");
    expect(backgrounds.light).toEqual({ src: "/home/default.jpg", position: "28% center" });
    expect(backgrounds.dark).toEqual(backgrounds.light);
  });

  it("reads an uploaded image from the API, with its focus", () => {
    const backgrounds = homeBackgrounds({ light: null, dark: uploaded }, "http://api.test");
    expect(backgrounds.dark).toEqual({
      src: "http://api.test/v1/site/home-images/dark/image?v=1",
      position: "72% center",
    });
    expect(backgrounds.light.src).toBe("/home/default.jpg");
  });
});
