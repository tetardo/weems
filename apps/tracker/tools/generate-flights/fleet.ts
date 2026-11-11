import type { AircraftInfo } from "@weems/contrats";
import { A320, type Disturbance, type Point, type Scenario } from "./scenario.ts";

const aircraft = (
  title: string,
  model: string,
  registration: string,
  emptyWeightKg: number,
): AircraftInfo => ({
  simulator: "replay",
  title,
  model,
  registration,
  engineCount: 2,
  emptyWeightKg,
});

const AIRPORTS = {
  LFLL: { lat: 45.7256, lon: 5.0811 },
  LFMN: { lat: 43.6584, lon: 7.2159 },
  LFBO: { lat: 43.6293, lon: 1.3638 },
  LFBD: { lat: 44.8283, lon: -0.7156 },
  EGLL: { lat: 51.47, lon: -0.4543 },
  EHAM: { lat: 52.3105, lon: 4.7683 },
  EDDF: { lat: 50.0379, lon: 8.5622 },
  EDDM: { lat: 48.3538, lon: 11.7861 },
  LSZH: { lat: 47.4582, lon: 8.5555 },
  LIMC: { lat: 45.6306, lon: 8.7231 },
  LEMD: { lat: 40.4983, lon: -3.5676 },
  LEBL: { lat: 41.2974, lon: 2.0833 },
  EBBR: { lat: 50.9014, lon: 4.4844 },
  EDDL: { lat: 51.2895, lon: 6.7668 },
  LFSB: { lat: 47.59, lon: 7.5291 },
  LFPG: { lat: 49.0097, lon: 2.5479 },
  LOWW: { lat: 48.1103, lon: 16.5697 },
  LKPR: { lat: 50.1008, lon: 14.26 },
  EIDW: { lat: 53.4213, lon: -6.2701 },
  EGCC: { lat: 53.3537, lon: -2.275 },
} satisfies Record<string, Point>;
type Icao = keyof typeof AIRPORTS;

const B738 = aircraft("Boeing 737-800", "B738", "F-WEMB", 41400);
const E190 = aircraft("Embraer E190", "E190", "F-WEME", 28000);
const AT76 = aircraft("ATR 72-600", "AT76", "F-WEMA", 13500);
const A319 = aircraft("Airbus A319", "A319", "F-WEMC", 40800);
const CRJ9 = aircraft("Bombardier CRJ900", "CRJ9", "F-WEMJ", 21400);

interface Leg {
  from: Icao;
  to: Icao;
  aircraft: AircraftInfo;
  cruiseAltFt: number;
  cruiseGs: number;
  approachGs: number;
  disturbances?: Disturbance[];
}

/** 10 short real routes in Europe with varied aircraft (spec J1, part 1). */
const LEGS: Leg[] = [
  { from: "LFLL", to: "LFMN", aircraft: A320, cruiseAltFt: 24000, cruiseGs: 400, approachGs: 140 },
  { from: "LFBO", to: "LFBD", aircraft: AT76, cruiseAltFt: 17000, cruiseGs: 270, approachGs: 115 },
  {
    from: "EGLL",
    to: "EHAM",
    aircraft: B738,
    cruiseAltFt: 26000,
    cruiseGs: 420,
    approachGs: 145,
    disturbances: ["goAround"],
  },
  { from: "EDDF", to: "EDDM", aircraft: A319, cruiseAltFt: 24000, cruiseGs: 400, approachGs: 135 },
  {
    from: "LSZH",
    to: "LIMC",
    aircraft: E190,
    cruiseAltFt: 23000,
    cruiseGs: 380,
    approachGs: 130,
    disturbances: ["bounce"],
  },
  { from: "LEMD", to: "LEBL", aircraft: A320, cruiseAltFt: 33000, cruiseGs: 450, approachGs: 140 },
  {
    from: "EBBR",
    to: "EDDL",
    aircraft: CRJ9,
    cruiseAltFt: 19000,
    cruiseGs: 360,
    approachGs: 135,
    disturbances: ["rejectedTakeoff"],
  },
  {
    from: "LFSB",
    to: "LFPG",
    aircraft: A319,
    cruiseAltFt: 27000,
    cruiseGs: 410,
    approachGs: 135,
    disturbances: ["pause"],
  },
  { from: "LOWW", to: "LKPR", aircraft: AT76, cruiseAltFt: 17000, cruiseGs: 270, approachGs: 115 },
  {
    from: "EIDW",
    to: "EGCC",
    aircraft: B738,
    cruiseAltFt: 25000,
    cruiseGs: 410,
    approachGs: 145,
    disturbances: ["touchAndGo"],
  },
];

export const FLEET: readonly Scenario[] = LEGS.map((leg, index) => ({
  name: `${leg.from.toLowerCase()}-${leg.to.toLowerCase()}`,
  callsign: `WMS${101 + index}`,
  seed: 101 + index,
  aircraft: leg.aircraft,
  departure: AIRPORTS[leg.from],
  arrival: AIRPORTS[leg.to],
  cruiseAltFt: leg.cruiseAltFt,
  cruiseGs: leg.cruiseGs,
  approachGs: leg.approachGs,
  disturbances: leg.disturbances ?? [],
}));
