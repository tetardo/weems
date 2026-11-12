const RAD = Math.PI / 180;

/**
 * Elevation of the sun's centre above the horizon, in degrees, at a time and place.
 * Low-precision formulas of the Astronomical Almanac (about 0.01° from 1950 to 2050), enough
 * to tell day from night to the minute.
 */
export function sunElevationDeg(at: Date, lat: number, lon: number): number {
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
  const siderealDeg = (280.460_618_37 + 360.985_647_366_29 * days + lon) % 360;
  const hourAngle = siderealDeg * RAD - rightAscension;
  const elevation = Math.asin(
    Math.sin(lat * RAD) * Math.sin(declination) +
      Math.cos(lat * RAD) * Math.cos(declination) * Math.cos(hourAngle),
  );
  return elevation / RAD;
}
