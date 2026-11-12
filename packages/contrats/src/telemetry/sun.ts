const RAD = Math.PI / 180;

/** Where the sun is overhead: latitude (declination) and longitude, in degrees. */
export interface SubsolarPoint {
  lat: number;
  lon: number;
}

/**
 * Point of the Earth where the sun is at the zenith at this time. Low-precision formulas of the
 * Astronomical Almanac (about 0.01° from 1950 to 2050), enough to tell day from night to the
 * minute. Shared by the API (day and night hours of a profile) and the site (night on the live map).
 */
export function subsolarPoint(at: Date): SubsolarPoint {
  const days = at.getTime() / 86_400_000 - 10_957.5; // since J2000.0 (2000-01-01 12:00 UTC)
  const meanLongitude = (280.46 + 0.985_647_4 * days) % 360;
  const meanAnomaly = ((357.528 + 0.985_600_3 * days) % 360) * RAD;
  const eclipticLongitude =
    (meanLongitude + 1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly)) * RAD;
  const obliquity = (23.439 - 0.000_000_4 * days) * RAD;
  const rightAscension = Math.atan2(
    Math.cos(obliquity) * Math.sin(eclipticLongitude),
    Math.cos(eclipticLongitude),
  );
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLongitude));
  const greenwichSiderealDeg = 280.460_618_37 + 360.985_647_366_29 * days;
  const lon = ((((rightAscension / RAD - greenwichSiderealDeg) % 360) + 540) % 360) - 180;
  return { lat: declination / RAD, lon };
}

/** Elevation of the sun's centre above the horizon, in degrees, at a time and place. */
export function sunElevationDeg(at: Date, lat: number, lon: number): number {
  const sun = subsolarPoint(at);
  const elevation = Math.asin(
    Math.sin(lat * RAD) * Math.sin(sun.lat * RAD) +
      Math.cos(lat * RAD) * Math.cos(sun.lat * RAD) * Math.cos((lon - sun.lon) * RAD),
  );
  return elevation / RAD;
}

/** Below this elevation it is night (end of civil twilight), on profiles and on the live map. */
export const NIGHT_BELOW_DEG = -6;
