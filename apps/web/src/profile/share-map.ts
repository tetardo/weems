import type { PilotRoutes } from "@weems/contrats";
import { routeLines, routesBounds } from "./routes-geojson.ts";

type Route = PilotRoutes["routes"][number];

const RAD = Math.PI / 180;

export interface ShareMap {
  /** SVG paths of the arcs, with their width. */
  lines: { d: string; width: number }[];
  /** Airports, in the same coordinates. */
  airports: [number, number][];
}

/**
 * The routes of a profile drawn flat in a width × height box, for the share image (no map
 * background there): equirectangular, longitudes shrunk by the cosine of the middle latitude so
 * that Europe keeps its shape, centred, with a margin for the airport dots.
 */
export function shareMap(
  routes: readonly Route[],
  width: number,
  height: number,
  margin = 12,
): ShareMap {
  const bounds = routesBounds(routes);
  if (!bounds) return { lines: [], airports: [] };
  const [[west, south], [east, north]] = bounds;
  const shrink = Math.cos(((south + north) / 2) * RAD);
  const spanX = Math.max((east - west) * shrink, 1e-6);
  const spanY = Math.max(north - south, 1e-6);
  const scale = Math.min((width - 2 * margin) / spanX, (height - 2 * margin) / spanY);
  const offsetX = (width - spanX * scale) / 2;
  const offsetY = (height - spanY * scale) / 2;
  const project = (lon: number, lat: number): [number, number] => [
    Math.round((offsetX + (lon - west) * shrink * scale) * 10) / 10,
    Math.round((offsetY + (north - lat) * scale) * 10) / 10,
  ];
  const features = routeLines(routes).features;
  return {
    lines: features.map(({ geometry, properties }) => ({
      d: geometry.coordinates
        .map(([lon = 0, lat = 0], i) => `${i === 0 ? "M" : "L"}${project(lon, lat).join(" ")}`)
        .join(""),
      width: Number(properties?.["width"] ?? 1),
    })),
    // Ends of the arcs: the unwrapped longitude of an arrival across the antimeridian stays in frame.
    airports: [
      ...new Map(
        features
          .flatMap(({ geometry: { coordinates } }) => [coordinates[0], coordinates.at(-1)])
          .map(([lon = 0, lat = 0] = []) => project(lon, lat))
          .map((point) => [point.join(","), point] as const),
      ).values(),
    ],
  };
}
