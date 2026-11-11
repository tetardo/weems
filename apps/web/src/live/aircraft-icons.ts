import type { Map as MapLibreMap } from "maplibre-gl";

const SIZE = 32;

/** Simple aircraft silhouette pointing north, drawn once per color. */
function drawAircraft(color: string): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");
  ctx.fillStyle = color;
  ctx.strokeStyle = "#ffffff";
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

export function addAircraftIcons(map: MapLibreMap): void {
  map.addImage(ICON_OK, drawAircraft("#1f5f99"), { pixelRatio: 1.4 });
  map.addImage(ICON_LOST, drawAircraft("#9aa5b1"), { pixelRatio: 1.4 });
}
