import type { BandMinute } from "@weems/contrats";
import { grouped } from "../ecam-values.ts";
import { milestones } from "./row-facts.ts";

type Weather = NonNullable<BandMinute["weather"]>;

/** Weather at one end of the flight: the minute it was read and what was recorded then. */
export interface StationWeather {
  minute: number;
  weather: Weather;
}

/** First minute from `from` (going `step` by one) that recorded some weather. */
function nearestWeather(minutes: readonly BandMinute[], from: number, step: 1 | -1) {
  for (let i = from; i >= 0 && i < minutes.length; i += step) {
    const weather = minutes[i]?.weather;
    if (weather && (weather.wind || weather.oat !== null || weather.visibilityM !== null)) {
      return { minute: i, weather };
    }
  }
  return null;
}

/**
 * Weather at departure (at takeoff, else the first minute) and at arrival (at touchdown, else the
 * last minute), Greg 14/11/2026; null when the flight recorded no weather there.
 */
export function stationWeather(minutes: readonly BandMinute[]) {
  const found = milestones(minutes);
  const takeoff = found.find((m) => m.key === "takeoff")?.minute ?? 0;
  const touchdown = found.find((m) => m.key === "touchdown")?.minute ?? minutes.length - 1;
  return {
    departure: nearestWeather(minutes, takeoff, -1) ?? nearestWeather(minutes, takeoff, 1),
    arrival: nearestWeather(minutes, touchdown, 1) ?? nearestWeather(minutes, touchdown, -1),
  };
}

/** Wind as written on a cockpit display: 270°/35 KT, CALM below 1 kt. */
export function windText(wind: Weather["wind"]): string {
  if (!wind) return "---";
  if (wind.speed < 1) return "CALM";
  return `${String(Math.round(wind.dir) % 360).padStart(3, "0")}°/${Math.round(wind.speed)} KT`;
}

/** Visibility as in a METAR spirit: 10 KM and more, else km, under 5 km in metres. */
export function visibilityText(metres: number | null): string {
  if (metres === null) return "---";
  if (metres >= 10_000) return "10 KM+";
  if (metres >= 5_000) return `${Math.floor(metres / 1000)} KM`;
  return `${grouped(Math.round(metres / 100) * 100)} M`;
}

/** Temperature with its sign: +18 °C, -4 °C. */
export function oatText(celsius: number | null): string {
  if (celsius === null) return "---";
  const value = Math.round(celsius);
  return `${value > 0 ? "+" : ""}${value} °C`;
}
