import type { BandMinute, FlightPhase } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { oatText, stationWeather, visibilityText, windText } from "./station-weather.ts";

const m = (phase: FlightPhase, weather?: BandMinute["weather"]) =>
  ({ at: "", phase, values: {}, ...(weather ? { weather } : {}) }) as BandMinute;
const w = (dir: number, oat: number) => ({ wind: { dir, speed: 10 }, oat, visibilityM: 9999 });

describe("stationWeather", () => {
  it("reads the weather at takeoff and at touchdown", () => {
    const minutes = [
      m("TAXI_OUT", w(90, 20)),
      m("TAKEOFF", w(100, 19)),
      m("CRUISE", w(270, -40)),
      m("LANDING", w(250, 12)),
      m("TAXI_IN", w(240, 13)),
    ];
    expect(stationWeather(minutes)).toEqual({
      departure: { minute: 1, weather: w(100, 19) },
      arrival: { minute: 3, weather: w(250, 12) },
    });
  });

  it("falls back to the nearest minute with weather, null on older flights", () => {
    expect(stationWeather([m("TAKEOFF"), m("CLIMB", w(10, 5))]).departure?.minute).toBe(1);
    expect(stationWeather([m("TAKEOFF"), m("LANDING")])).toEqual({
      departure: null,
      arrival: null,
    });
  });
});

describe("weather texts", () => {
  it("writes wind, visibility and temperature as a display does", () => {
    expect(windText({ dir: 5, speed: 12.4 })).toBe("005°/12 KT");
    expect(windText({ dir: 200, speed: 0.4 })).toBe("CALM");
    expect(windText(null)).toBe("---");
    expect(visibilityText(25_000)).toBe("10 KM+");
    expect(visibilityText(6_400)).toBe("6 KM");
    expect(visibilityText(1_260)).toBe("1 300 M");
    expect(oatText(18.4)).toBe("+18 °C");
    expect(oatText(-4)).toBe("-4 °C");
  });
});
