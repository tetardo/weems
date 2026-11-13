/** One coordinate in degrees and decimal minutes, as on a navigation display: 43°58.2′ N. */
interface Axis {
  positive: string;
  negative: string;
  /** Digits of the degrees. */
  width: number;
}

const LATITUDE: Axis = { positive: "N", negative: "S", width: 2 };
const LONGITUDE: Axis = { positive: "E", negative: "W", width: 3 };

function part(value: number, { positive, negative, width }: Axis, decimal: string) {
  const abs = Math.abs(value);
  let degrees = Math.floor(abs);
  let minutes = Math.round((abs - degrees) * 600) / 10;
  if (minutes >= 60) {
    degrees += 1;
    minutes = 0;
  }
  const shown = minutes.toFixed(1).padStart(4, "0").replace(".", decimal);
  return `${String(degrees).padStart(width, "0")}°${shown}′ ${value < 0 ? negative : positive}`;
}

/**
 * Position of the aircraft (Greg, 13/11/2026): latitude on 2 digits, longitude on 3, minutes to
 * the tenth, with the decimal separator of the page's language.
 */
export function formatCoordinates(lat: number, lon: number, decimal: string): string {
  return `${part(lat, LATITUDE, decimal)} · ${part(lon, LONGITUDE, decimal)}`;
}
