import type { AircraftCategory } from "@weems/contrats";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { MapTheme } from "../map/map-theme.ts";
import { familyOf, iconNames, ROTOR, SHAPES } from "./aircraft-shapes.ts";

const SIZE = 32;

/** One silhouette (spec J4, aircraft categories), outlined with `halo`, drawn once per image. */
function drawAircraft(category: AircraftCategory | null, color: string, halo: string): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");
  const family = familyOf(category);
  const shape = new Path2D(SHAPES[family]);
  if (family === "helicopter") {
    ctx.setLineDash([3, 2]);
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(ROTOR.x, ROTOR.y, ROTOR.radius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.lineJoin = "round";
  ctx.lineWidth = 3;
  ctx.strokeStyle = halo;
  ctx.stroke(shape);
  ctx.fillStyle = color;
  ctx.fill(shape);
  return ctx.getImageData(0, 0, SIZE, SIZE);
}

/**
 * Draws every aircraft image in the colours of `theme` (the category's colour, grey when the
 * signal is lost), replacing those of the previous theme.
 */
export function addAircraftIcons(
  map: MapLibreMap,
  theme: MapTheme,
  colors: Readonly<Record<AircraftCategory, string>>,
): void {
  for (const { name, category, lost } of iconNames()) {
    const color = lost ? theme.aircraftLost : category ? colors[category] : theme.aircraft;
    if (map.hasImage(name)) map.removeImage(name);
    map.addImage(name, drawAircraft(category, color, theme.halo), { pixelRatio: 1.4 });
  }
}
