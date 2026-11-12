/**
 * Pseudonyms of the fictitious pilots, used as their callsign (at most 10 characters, contract
 * FlightOpening). Two styles, mixed half and half:
 * - simulator style: aviation words, phonetic alphabet, flight levels ("Skyhawk72", "KiloEcho");
 * - first name with a suffix drawn from the pilot ("Hugo31", "Daan_EHAM", "Chloe1994").
 * Never a real airline code, a registration or a famous character: these exist for real.
 * Deterministic: same random sequence, same pseudonyms.
 */

/** What the pseudonym may draw from: the pilot as the populate tool imagined it. */
export interface PseudonymSource {
  firstName: string;
  lastName: string;
  country: string;
  homeIcao: string;
}

export const MAX_PSEUDONYM_LENGTH = 10;
/** Share of the simulator style; the rest is first name + suffix. */
const SIM_STYLE_SHARE = 0.5;
const ATTEMPTS = 20;

const WORDS = [
  "Skyhawk",
  "Glideslope",
  "Crosswind",
  "Tailwind",
  "Headwind",
  "Contrail",
  "Jetstream",
  "Downwind",
  "Pushback",
  "Localizer",
  "Beacon",
  "Vortex",
  "Stratus",
  "Nimbus",
  "Cumulus",
  "Altimeter",
  "Rudder",
  "Aileron",
  "Flaps",
  "Vector",
  "Holding",
  "Taxiway",
  "Turboprop",
  "Heavy",
  "NightHeavy",
  "Bushpilot",
  "Tailwheel",
  "Propwash",
  "Clearance",
  "Otter",
] as const;

/** Phonetic alphabet, without the words that are also airline or brand names on their own. */
const PHONETIC = [
  "Alfa",
  "Bravo",
  "Charlie",
  "Echo",
  "Foxtrot",
  "Golf",
  "Hotel",
  "India",
  "Juliett",
  "Kilo",
  "Lima",
  "Mike",
  "Oscar",
  "Papa",
  "Romeo",
  "Sierra",
  "Tango",
  "Victor",
  "Whiskey",
  "Yankee",
  "Zulu",
] as const;

const REGIONS = ["Alpes", "Jura", "Vosges", "Corse", "Pyrenees", "Alps", "Dolomiti", "Tatra"];
const LEVELS = ["Cruise", "FL"] as const;
/** Transponder codes of everyday flying, never 7500, 7600 or 7700 (emergencies). */
const SQUAWKS = ["1000", "2000", "7000", "1200", "4512", "3741"];
const TYPES = ["A320", "A321", "737", "B738", "ATR", "E190", "C172", "DA40", "TBM", "PC12", "CRJ"];
/** French département of each home airport: "Hugo31" for a pilot based at Toulouse. */
const DEPARTEMENTS: Record<string, string> = {
  LFPG: "95",
  LFLL: "69",
  LFMN: "06",
  LFBO: "31",
  LFBD: "33",
  LFSB: "68",
};

type Random = () => number;
const pickOf = <T>(random: Random, list: readonly T[]): T =>
  list[Math.floor(random() * list.length)] as T;
const between = (random: Random, min: number, max: number) =>
  min + Math.floor(random() * (max - min + 1));

/** "Léa" → "Lea", "Tomáš" → "Tomas", "de Vries" → "deVries": ASCII letters only. */
export function asciiLetters(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z]/g, "");
}

/** Weighted makers: one is drawn, then it makes its part (null when it does not apply). */
type Maker = readonly [weight: number, make: () => string | null];

function drawn(random: Random, makers: readonly Maker[]): string | null {
  let left = random() * makers.reduce((sum, [weight]) => sum + weight, 0);
  for (const [weight, make] of makers) {
    left -= weight;
    if (left < 0) return make();
  }
  return null;
}

function simStyle(random: Random): string | null {
  return drawn(random, [
    [45, () => `${pickOf(random, WORDS)}${between(random, 1, 99)}`],
    [15, () => `${pickOf(random, PHONETIC)}${pickOf(random, PHONETIC)}`],
    [12, () => `VFR_${pickOf(random, REGIONS)}`],
    [14, () => `${pickOf(random, LEVELS)}${between(random, 18, 41)}0`],
    [7, () => `Squawk${pickOf(random, SQUAWKS)}`],
    [7, () => `Mach0${between(random, 72, 85)}`],
  ]);
}

function suffixOf(source: PseudonymSource, random: Random): string | null {
  const initial = asciiLetters(source.lastName)
    .replace(/^[a-z]+/, "")
    .charAt(0)
    .toUpperCase();
  const departement = DEPARTEMENTS[source.homeIcao];
  return drawn(random, [
    [20, () => `_${pickOf(random, TYPES)}`],
    [12, () => pickOf(random, TYPES)],
    [15, () => `${random() < 0.5 ? "_" : ""}${source.homeIcao}`],
    [10, () => `_${source.country}`],
    [12, () => (initial ? `.${initial}` : null)],
    [13, () => String(between(random, 1975, 2005))],
    [10, () => departement ?? null],
    [8, () => String(between(random, 2, 99)).padStart(2, "0")],
  ]);
}

function firstNameStyle(source: PseudonymSource, random: Random): string {
  const suffix = suffixOf(source, random);
  if (suffix === null) return "";
  const pseudonym = `${asciiLetters(source.firstName)}${suffix}`;
  // "hugo_737", "lea1994", never "larseham": lowercase only when the suffix stands apart.
  return /^[A-Za-z]/.test(suffix) || random() >= 0.2 ? pseudonym : pseudonym.toLowerCase();
}

/**
 * Draws one pseudonym per pilot, all different (case ignored) and at most 10 characters.
 * After a few draws that collide or are too long, a number is added to stay unique.
 */
export function pseudonymsOf(sources: readonly PseudonymSource[], random: Random): string[] {
  const used = new Set<string>();
  const valid = (pseudonym: string) =>
    pseudonym.length >= 3 &&
    pseudonym.length <= MAX_PSEUDONYM_LENGTH &&
    !used.has(pseudonym.toLowerCase());
  return sources.map((source, index) => {
    const simFirst = random() < SIM_STYLE_SHARE;
    let pseudonym = "";
    for (let attempt = 0; attempt < ATTEMPTS && !valid(pseudonym); attempt++) {
      const sim = attempt < ATTEMPTS / 2 ? simFirst : !simFirst;
      pseudonym = (sim ? simStyle(random) : firstNameStyle(source, random)) ?? "";
    }
    if (!valid(pseudonym)) pseudonym = `Pilot${index + 1}`;
    used.add(pseudonym.toLowerCase());
    return pseudonym;
  });
}
