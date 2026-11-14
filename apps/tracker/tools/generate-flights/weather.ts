/** Weather at one airport, drawn from the flight's seed: plausible values, not a forecast. */
export interface Weather {
  /** Where the surface wind comes from, degrees. */
  windDirDeg: number;
  surfaceWindKt: number;
  /** Difference with the standard atmosphere, °C. */
  isaDeviationC: number;
  visibilityM: number;
  /** Rain on the runways: surface condition "wet". */
  wetRunways: boolean;
}

/** Wind veers and strengthens with height: about 2.5 kt and 1° per 1 000 ft, at most 140 kt. */
const WIND_KT_PER_1000_FT = 2.5;
const WIND_VEER_DEG_PER_1000_FT = 1;
const MAX_WIND_KT = 140;
/** Standard atmosphere: 15 °C at sea level, -1.98 °C per 1 000 ft up to 36 089 ft. */
const ISA_SEA_LEVEL_C = 15;
const ISA_LAPSE_C_PER_1000_FT = 1.98;
const TROPOPAUSE_FT = 36_089;
/** One flight in six in poor visibility. */
const POOR_VISIBILITY_SHARE = 1 / 6;

/** Weather at each end of the flight; in between, it moves from one to the other. */
export interface RouteWeather {
  departure: Weather;
  arrival: Weather;
}

function drawWeather(random: () => number): Weather {
  const poor = random() < POOR_VISIBILITY_SHARE;
  return {
    windDirDeg: Math.floor(random() * 360),
    // Mostly light winds, sometimes a strong one.
    surfaceWindKt: Math.round(random() ** 2 * 30),
    isaDeviationC: Math.round(random() * 25 - 10),
    visibilityM: Math.round(poor ? 800 + random() * 4200 : 9000 + random() * 21000),
    wetRunways: random() < 0.2,
  };
}

/** Weather at both airports, from two independent streams. */
export function drawRouteWeather(departure: () => number, arrival: () => number): RouteWeather {
  return { departure: drawWeather(departure), arrival: drawWeather(arrival) };
}

const mix = (a: number, b: number, share: number) => a + (b - a) * share;

/** Wind direction turned the short way, degrees in [0, 360). */
function mixDir(a: number, b: number, share: number): number {
  const turn = ((((b - a) % 360) + 540) % 360) - 180;
  return Math.round((a + turn * share + 360) % 360) % 360;
}

/**
 * Weather at `share` of the way (0 at the departure, 1 at the arrival): values move linearly,
 * the runway state is the nearest airport's.
 */
export function weatherAlong(route: RouteWeather, share: number): Weather {
  const { departure: a, arrival: b } = route;
  const s = Math.min(1, Math.max(0, share));
  return {
    windDirDeg: mixDir(a.windDirDeg, b.windDirDeg, s),
    surfaceWindKt: mix(a.surfaceWindKt, b.surfaceWindKt, s),
    isaDeviationC: mix(a.isaDeviationC, b.isaDeviationC, s),
    visibilityM: Math.round(mix(a.visibilityM, b.visibilityM, s)),
    wetRunways: s < 0.5 ? a.wetRunways : b.wetRunways,
  };
}

export function windAt(weather: Weather, altMslFt: number): { dir: number; speed: number } {
  const thousands = Math.max(0, altMslFt) / 1000;
  return {
    dir: Math.round(weather.windDirDeg + thousands * WIND_VEER_DEG_PER_1000_FT) % 360,
    speed: Math.min(MAX_WIND_KT, weather.surfaceWindKt + thousands * WIND_KT_PER_1000_FT),
  };
}

/** Outside air temperature, °C. */
export function oatAt(weather: Weather, altMslFt: number): number {
  const height = Math.min(Math.max(0, altMslFt), TROPOPAUSE_FT);
  return ISA_SEA_LEVEL_C - (height / 1000) * ISA_LAPSE_C_PER_1000_FT + weather.isaDeviationC;
}
