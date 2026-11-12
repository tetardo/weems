import { NIGHT_BELOW_DEG, sunElevationDeg } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { nightArea } from "./night-area.ts";

const ringAt = (iso: string) => {
  const polygons = nightArea(new Date(iso)).geometry.coordinates;
  expect(polygons).toHaveLength(3);
  return polygons[1]?.[0] ?? [];
};

describe("night area on the live map", () => {
  it("follows the end of civil twilight along its edge", () => {
    const at = "2026-11-12T00:00:00Z";
    for (const [lon = 0, lat = 0] of ringAt(at).filter(([, lat]) => Math.abs(lat ?? 0) < 89)) {
      expect(sunElevationDeg(new Date(at), lat, lon)).toBeCloseTo(NIGHT_BELOW_DEG, 1);
    }
  });

  it("closes through the North Pole in November, when the polar night is north", () => {
    const ring = ringAt("2026-11-12T00:00:00Z");
    expect(ring.some(([, lat]) => lat === 90)).toBe(true);
    expect(ring.some(([, lat]) => lat === -90)).toBe(false);
  });

  it("closes through the South Pole in June", () => {
    expect(ringAt("2026-06-21T00:00:00Z").some(([, lat]) => lat === -90)).toBe(true);
  });

  it("copies the area one world to each side", () => {
    const [west, middle] = nightArea(new Date("2026-06-21T00:00:00Z")).geometry.coordinates;
    expect(west?.[0]?.[0]?.[0]).toBeCloseTo((middle?.[0]?.[0]?.[0] ?? 0) - 360);
  });
});
