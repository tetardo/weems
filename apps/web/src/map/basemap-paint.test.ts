import type { StyleSpecification } from "maplibre-gl";
import { describe, expect, it } from "vitest";
import { withBasemapPaint } from "./basemap-paint.ts";
import { DARK_BASEMAP_PAINT } from "./dark-basemap.ts";

const style: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    { id: "background", type: "background", paint: { "background-color": "rgb(12,12,12)" } },
    {
      id: "water",
      type: "fill",
      source: "x",
      paint: { "fill-color": "#111", "fill-opacity": 0.5 },
    },
    { id: "unknown", type: "fill", source: "x", paint: { "fill-color": "#000" } },
  ],
};

describe("basemap paint", () => {
  it("sets the given colours and keeps the other paint properties", () => {
    const [background, water] = withBasemapPaint(style, {
      background: { "background-color": "#222" },
      water: { "fill-color": "#333" },
    }).layers;
    expect(background?.paint).toEqual({ "background-color": "#222" });
    expect(water?.paint).toEqual({ "fill-color": "#333", "fill-opacity": 0.5 });
  });

  it("leaves untouched the layers it does not name, and ignores ids missing from the style", () => {
    const result = withBasemapPaint(style, { gone: { "fill-color": "#fff" } });
    expect(result.layers).toEqual(style.layers);
  });

  it("does not change the style it is given", () => {
    withBasemapPaint(style, DARK_BASEMAP_PAINT);
    expect(style.layers[0]?.paint).toEqual({ "background-color": "rgb(12,12,12)" });
  });

  it("lightens the land of the dark basemap", () => {
    const [background] = withBasemapPaint(style, DARK_BASEMAP_PAINT).layers;
    expect(background?.paint).toEqual({ "background-color": "#222b3f" });
  });
});
