import type { TrackPoint } from "@weems/contrats";

const START_MS = Date.parse("2026-11-11T08:00:00.000Z");

/**
 * A trajectory of `count` points, one per second from 08:00 UTC: on the ground for the
 * first and last tenth, climbing then descending in between, flying south.
 */
export function syntheticTrack(count: number): TrackPoint[] {
  return Array.from({ length: count }, (_, i) => {
    const progress = i / (count - 1);
    const onGround = progress < 0.1 || progress > 0.9;
    const air = onGround ? 0 : Math.sin(((progress - 0.1) / 0.8) * Math.PI);
    return {
      at: new Date(START_MS + i * 1000).toISOString(),
      lat: 49 - progress * 5,
      lon: 2.5 - progress,
      altMsl: 400 + air * 35_000,
      altAgl: air * 35_000,
      ias: onGround ? 10 : 250,
      gs: onGround ? 12 : 300 + air * 150,
      vs: onGround ? 0 : Math.round(Math.cos(((progress - 0.1) / 0.8) * Math.PI) * 2000),
      heading: 195,
      onGround,
    };
  });
}
