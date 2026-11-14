/** Types of `magvar` (World Magnetic Model 2025-2030), which ships none. */
declare module "magvar" {
  /** Magnetic declination in degrees, east positive; altitude in kilometres above mean sea level. */
  export function magvar(
    latitude: number,
    longitude: number,
    altitudeKm: number,
    when: Date,
  ): number;
}
