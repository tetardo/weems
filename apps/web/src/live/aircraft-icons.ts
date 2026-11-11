import type { Map as MapLibreMap } from "maplibre-gl";
import type { MapTheme } from "../map/map-theme.ts";

const SIZE = 32;

/** Simple aircraft silhouette pointing north, drawn once per color, outlined with `halo`. */
function drawAircraft(color: string, halo: string): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");
  ctx.fillStyle = color;
  ctx.strokeStyle = halo;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  // Fuselage, wings and tail, centred on (16, 16).
  const points = [
    [16, 2],
    [18, 12],
    [30, 18],
    [30, 20],
    [18, 17],
    [17.5, 26],
    [21, 29],
    [21, 30],
    [16, 28.5],
    [11, 30],
    [11, 29],
    [14.5, 26],
    [14, 17],
    [2, 20],
    [2, 18],
    [14, 12],
  ];
  points.forEach(([x, y], i) =>
    i === 0 ? ctx.moveTo(x ?? 0, y ?? 0) : ctx.lineTo(x ?? 0, y ?? 0),
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  return ctx.getImageData(0, 0, SIZE, SIZE);
}

export const ICON_OK = "aircraft-ok";
export const ICON_LOST = "aircraft-lost";

/** Draws both icons in the colours of `theme`, replacing those of the previous theme. */
export function addAircraftIcons(map: MapLibreMap, theme: MapTheme): void {
  for (const [id, color] of [
    [ICON_OK, theme.aircraft],
    [ICON_LOST, theme.aircraftLost],
  ] as const) {
    if (map.hasImage(id)) map.removeImage(id);
    map.addImage(id, drawAircraft(color, theme.halo), { pixelRatio: 1.4 });
  }
}
