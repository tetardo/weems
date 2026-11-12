import type { BasemapPaint } from "./basemap-paint.ts";

/**
 * Lighter colours for the OpenFreeMap « dark » basemap (Greg, 12/11/2026: the maps were too dark
 * in the dark theme). Its near-black greys become the night blues of the site (src/app/global.css:
 * land just above --wm-surface, water a deeper blue, roads and borders a few steps lighter),
 * and place names take the muted text colour so they read without competing with our aircraft.
 */
const LAND = "#222b3f";
const WATER = "#141c2e";
const GREEN = "#263247";
const BUILT = "#2b3650";
const ROAD_MINOR = "#323e57";
const ROAD_MAJOR = "#3b4864";
const ROAD_MOTORWAY = "#4a5978";
const CASING = "rgba(92, 108, 140, 0.8)";
const RAIL = "#3a465f";
const BORDER = "#5d6b88";
const BORDER_STATE = "#465370";
const LABEL = "#9aa6bf";
const LABEL_ROAD = "#7c89a3";
const LABEL_WATER = "#6f87b0";
const HALO = "rgba(14, 19, 32, 0.85)";

export const DARK_BASEMAP_PAINT: BasemapPaint = {
  background: { "background-color": LAND },
  water: { "fill-color": WATER },
  waterway: { "line-color": WATER },
  water_name: { "text-color": LABEL_WATER, "text-halo-color": HALO },
  landcover_ice_shelf: { "fill-color": BUILT },
  landcover_glacier: { "fill-color": BUILT },
  landuse_residential: { "fill-color": BUILT },
  landcover_wood: { "fill-color": GREEN },
  landuse_park: { "fill-color": GREEN },
  building: { "fill-color": BUILT, "fill-outline-color": ROAD_MINOR },
  "aeroway-area": { "fill-color": BUILT },
  "aeroway-taxiway": { "line-color": ROAD_MAJOR },
  "aeroway-runway-casing": { "line-color": CASING },
  "aeroway-runway": { "line-color": ROAD_MOTORWAY },
  road_area_pier: { "fill-color": LAND },
  road_pier: { "line-color": LAND },
  highway_path: { "line-color": ROAD_MINOR },
  highway_minor: { "line-color": ROAD_MINOR },
  highway_major_casing: { "line-color": CASING },
  highway_major_inner: { "line-color": ROAD_MAJOR },
  highway_major_subtle: { "line-color": ROAD_MAJOR },
  highway_motorway_casing: { "line-color": CASING },
  highway_motorway_inner: { "line-color": ROAD_MOTORWAY },
  highway_motorway_subtle: { "line-color": ROAD_MAJOR },
  railway_transit: { "line-color": RAIL },
  railway_transit_dashline: { "line-color": LAND },
  railway_minor: { "line-color": RAIL },
  railway_minor_dashline: { "line-color": LAND },
  railway: { "line-color": RAIL },
  railway_dashline: { "line-color": LAND },
  highway_name_other: { "text-color": LABEL_ROAD, "text-halo-color": HALO },
  highway_name_motorway: { "text-color": LABEL_ROAD },
  boundary_state: { "line-color": BORDER_STATE },
  "boundary_country_z0-4": { "line-color": BORDER },
  "boundary_country_z5-": { "line-color": BORDER },
  ...Object.fromEntries(
    [
      "place_other",
      "place_suburb",
      "place_village",
      "place_town",
      "place_city",
      "place_city_large",
      "place_state",
      "place_country_other",
      "place_country_minor",
      "place_country_major",
    ].map((id) => [id, { "text-color": LABEL, "text-halo-color": HALO }]),
  ),
};
