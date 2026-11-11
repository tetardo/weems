import { angleDiffDeg, bearingDeg, destinationPoint, type LatLon } from "../../../src/core/geo.ts";
import type { AirportData, RunwayEnd } from "../airports/airport-data.ts";
import type { Leg } from "./navigator.ts";

const FT_PER_NM = 6076.12;
/** Wind of the samples (sample-factory): runways are picked with a headwind. */
const WIND_FROM_DEG = 270;
/** Pilots aim 1 000 ft past the threshold. */
const AIM_POINT_FT = 1000;
/** Climb on the runway axis this far past its end before turning (simplified departure). */
const CLIMB_OUT_NM = 5;
/** Arrival entry and circuit, in NM along the extended centreline and beside it. */
const STRAIGHT_IN_NM = 15;
const BASE_ALONG_NM = 14;
const DOWNWIND_BASE_NM = 12;
const CIRCUIT_BASE_NM = 10;
const DOWNWIND_SIDE_NM = 4;
/** The base leg ends this far from the centreline: the final is intercepted at 30°. */
const BASE_END_SIDE_NM = 1.5;

/** Runway ends with a headwind (or no wind component), one of them drawn by `random`. */
export function pickRunway(airport: AirportData, random: () => number): RunwayEnd {
  const into = airport.runways.filter(
    (r) => Math.abs(angleDiffDeg(r.headingDeg, WIND_FROM_DEG)) <= 90,
  );
  const choices = into.length > 0 ? into : airport.runways;
  return choices[Math.floor(random() * choices.length)] as RunwayEnd;
}

const lengthNm = (runway: RunwayEnd) => runway.lengthFt / FT_PER_NM;

/** Point `alongNm` before the threshold on the extended centreline, `sideNm` to one side. */
function offCentreline(runway: RunwayEnd, alongNm: number, sideNm: number): LatLon {
  const outbound = runway.headingDeg + 180;
  const onAxis = destinationPoint(runway, outbound, alongNm);
  return sideNm === 0
    ? onAxis
    : destinationPoint(onAxis, outbound + 90 * Math.sign(sideNm), Math.abs(sideNm));
}

/** Last leg of every approach: along the runway axis to the aiming point. */
function finalLeg(runway: RunwayEnd): Leg {
  const aimNm = (AIM_POINT_FT + runway.displacedThresholdFt) / FT_PER_NM;
  return { fix: destinationPoint(runway, runway.headingDeg, aimNm), course: runway.headingDeg };
}

/** Along the runway, `beyondNm` past its far end. */
export function runwayAxisLeg(runway: RunwayEnd, beyondNm = 0): Leg {
  const fix = destinationPoint(runway, runway.headingDeg, lengthNm(runway) + beyondNm);
  return { fix, course: runway.headingDeg };
}

/** Downwind abeam the threshold (optional), base turn at `alongNm`, base leg toward the final. */
function pattern(runway: RunwayEnd, alongNm: number, side: number, downwind: boolean): Leg[] {
  const legs = [
    { fix: offCentreline(runway, alongNm, DOWNWIND_SIDE_NM * side) },
    { fix: offCentreline(runway, alongNm, BASE_END_SIDE_NM * side) },
    finalLeg(runway),
  ];
  return downwind ? [{ fix: offCentreline(runway, -1, DOWNWIND_SIDE_NM * side) }, ...legs] : legs;
}

/**
 * Simplified arrival (no real STAR, its data is licensed): straight in when coming from behind
 * the runway, a base entry from the side, a downwind past the airport when coming from ahead.
 */
export function arrivalLegs(runway: RunwayEnd, from: LatLon): Leg[] {
  const relative = angleDiffDeg(runway.headingDeg + 180, bearingDeg(runway, from));
  const side = relative >= 0 ? 1 : -1;
  if (Math.abs(relative) <= 60) {
    return [{ fix: offCentreline(runway, STRAIGHT_IN_NM, 0) }, finalLeg(runway)];
  }
  if (Math.abs(relative) <= 120) return pattern(runway, BASE_ALONG_NM, side, false);
  return pattern(runway, DOWNWIND_BASE_NM, side, true);
}

/** Left-hand circuit after a go-around or a touch-and-go, back to the same runway. */
export function circuitLegs(runway: RunwayEnd): Leg[] {
  return [runwayAxisLeg(runway, 2), ...pattern(runway, CIRCUIT_BASE_NM, 1, true)];
}

/** Climb-out on the runway axis, then direct to the arrival. */
export function enrouteLegs(departure: RunwayEnd, arrival: RunwayEnd): Leg[] {
  return [runwayAxisLeg(departure, CLIMB_OUT_NM), ...arrivalLegs(arrival, departure)];
}
