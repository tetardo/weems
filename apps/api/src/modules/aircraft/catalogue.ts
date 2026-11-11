import type { AircraftCategory } from "@weems/contrats";

/**
 * Weems catalogue of ICAO type designators, by category (spec J4, aircraft categories).
 * Written by Weems from public type designators (facts), not copied from ICAO Doc 8643
 * (decision docs/decisions/006-catalogue-des-avions.md). Covers the MSFS 2020 and 2024 fleets
 * and the most flown add-ons; a type missing here falls back to an estimate (classify.ts).
 * After a change, run `pnpm reclassify` to update the flights already recorded.
 */
// prettier-ignore
const TYPES_BY_CATEGORY: Readonly<Record<AircraftCategory, readonly string[]>> = {
  light: [
    "AA5", "BE33", "BE35", "BE36", "BE55", "BE58", "BE76", "C150", "C152", "C162", "C172",
    "C177", "C182", "C206", "C210", "C310", "C340", "C414", "C421", "DA40", "DA42", "DA50",
    "DA62", "DHC2", "DR40", "DV20", "E300", "J3", "M20P", "M20T", "P28A", "P28R", "PA18",
    "PA24", "PA32", "PA34", "PA44", "PA46", "PTS1", "PTS2", "SR20", "SR22", "TB10", "TB20",
    "TB21", "VL3", "XCUB", "A5",
  ],
  turboprop: [
    "A400", "AT43", "AT45", "AT72", "AT75", "AT76", "B190", "B350", "BE20", "BE9L", "C130",
    "C208", "C441", "D328", "DH8A", "DH8B", "DH8C", "DH8D", "DHC6", "DHC7", "E120", "F50",
    "JS32", "JS41", "KODI", "L410", "MU2", "P180", "P46T", "PAY2", "PAY3", "PC12", "PC21",
    "PC6T", "SF34", "SH36", "SW4", "TBM7", "TBM8", "TBM9",
  ],
  businessJet: [
    "BE40", "C25A", "C25B", "C25C", "C25M", "C510", "C525", "C550", "C560", "C56X", "C680",
    "C68A", "C700", "C750", "CL30", "CL35", "CL60", "E50P", "E545", "E550", "E55P", "EA50",
    "F2TH", "F900", "FA50", "FA7X", "FA8X", "G280", "GL5T", "GL7T", "GLEX", "GLF4", "GLF5",
    "GLF6", "H25B", "HDJT", "LJ35", "LJ45", "LJ60", "LJ75", "PC24", "PRM1", "SF50",
  ],
  regionalJet: [
    "AJ27", "B461", "B462", "B463", "CRJ1", "CRJ2", "CRJ7", "CRJ9", "CRJX", "E135", "E145",
    "E170", "E175", "E190", "E195", "E290", "E295", "E75L", "E75S", "F100", "F28", "F70",
    "RJ1H", "RJ70", "RJ85", "SU95",
  ],
  narrowBody: [
    "A318", "A319", "A320", "A321", "A19N", "A20N", "A21N", "B712", "B721", "B722", "B731",
    "B732", "B733", "B734", "B735", "B736", "B737", "B738", "B739", "B37M", "B38M", "B39M",
    "B3XM", "B752", "B753", "BCS1", "BCS3", "C919", "DC91", "DC93", "DC95", "MD81", "MD82",
    "MD83", "MD87", "MD88", "MD90", "T204",
  ],
  wideBody: [
    "A124", "A306", "A30B", "A310", "A332", "A333", "A338", "A339", "A342", "A343", "A345",
    "A346", "A359", "A35K", "A388", "B741", "B742", "B743", "B744", "B748", "B74S", "B762",
    "B763", "B764", "B772", "B773", "B778", "B779", "B77L", "B77W", "B788", "B789", "B78X",
    "DC10", "IL96", "L101", "MD11",
  ],
  helicopter: [
    "A109", "A119", "A139", "A169", "A189", "AS50", "AS55", "AS65", "B06", "B407", "B412",
    "B429", "B505", "EC20", "EC30", "EC35", "EC45", "EC55", "EC75", "G2CA", "H160", "H47",
    "MI8", "NH90", "R22", "R44", "R66", "S76", "S92", "UH60",
  ],
  other: [
    "AJET", "AS21", "AS29", "CONC", "DISC", "EUFI", "F15", "F16", "F18", "F35", "GLID", "HAWK",
    "L39", "LS8", "MIR2", "P51", "RFAL", "SPIT", "T38",
  ],
};

const CATALOGUE: ReadonlyMap<string, AircraftCategory> = new Map(
  Object.entries(TYPES_BY_CATEGORY).flatMap(([category, types]) =>
    types.map((type) => [type, category as AircraftCategory] as const),
  ),
);

/** Category of an ICAO type designator, or null when the catalogue does not know it. */
export function catalogueCategory(icaoType: string): AircraftCategory | null {
  return CATALOGUE.get(icaoType.trim().toUpperCase()) ?? null;
}
