import type { PilotLevel } from "@weems/contrats";
import { pseudonymsOf } from "./pseudonyms.ts";

/** A fictitious pilot as the populate tool imagines it, before the API creates the account. */
export interface Identity {
  name: string;
  /** Profile address: from the name, made unique by its index. */
  handle: string;
  country: string;
  homeIcao: string;
  /** UTC offset of the home airport in winter, hours (daylight saving time ignored). */
  utcOffsetH: number;
  level: PilotLevel | null;
  /** Pseudonym flown as callsign on all the pilot's flights ("Skyhawk72", "Hugo31"). */
  callsign: string;
  isPublic: boolean;
}

/**
 * Home airports of the fictitious pilots (in airports.json), with their country and their UTC
 * offset in winter: a pilot flies at their own evening, wherever the flight goes.
 */
const HOMES: readonly { icao: string; country: string; utcOffsetH: number }[] = [
  { icao: "LFPG", country: "FR", utcOffsetH: 1 },
  { icao: "LFLL", country: "FR", utcOffsetH: 1 },
  { icao: "LFMN", country: "FR", utcOffsetH: 1 },
  { icao: "LFBO", country: "FR", utcOffsetH: 1 },
  { icao: "LFBD", country: "FR", utcOffsetH: 1 },
  { icao: "LFSB", country: "FR", utcOffsetH: 1 },
  { icao: "EGLL", country: "GB", utcOffsetH: 0 },
  { icao: "EGCC", country: "GB", utcOffsetH: 0 },
  { icao: "EHAM", country: "NL", utcOffsetH: 1 },
  { icao: "EDDF", country: "DE", utcOffsetH: 1 },
  { icao: "EDDM", country: "DE", utcOffsetH: 1 },
  { icao: "EDDL", country: "DE", utcOffsetH: 1 },
  { icao: "LSZH", country: "CH", utcOffsetH: 1 },
  { icao: "LIMC", country: "IT", utcOffsetH: 1 },
  { icao: "LEMD", country: "ES", utcOffsetH: 1 },
  { icao: "LEBL", country: "ES", utcOffsetH: 1 },
  { icao: "EBBR", country: "BE", utcOffsetH: 1 },
  { icao: "LOWW", country: "AT", utcOffsetH: 1 },
  { icao: "LKPR", country: "CZ", utcOffsetH: 1 },
  { icao: "EIDW", country: "IE", utcOffsetH: 0 },
  { icao: "LFPO", country: "FR", utcOffsetH: 1 },
  { icao: "LFPB", country: "FR", utcOffsetH: 1 },
  { icao: "LFRS", country: "FR", utcOffsetH: 1 },
  { icao: "LFRB", country: "FR", utcOffsetH: 1 },
  { icao: "LFBH", country: "FR", utcOffsetH: 1 },
  { icao: "LFBP", country: "FR", utcOffsetH: 1 },
  { icao: "LFBZ", country: "FR", utcOffsetH: 1 },
  { icao: "LFMT", country: "FR", utcOffsetH: 1 },
  { icao: "LFML", country: "FR", utcOffsetH: 1 },
  { icao: "LFKJ", country: "FR", utcOffsetH: 1 },
  { icao: "LFLC", country: "FR", utcOffsetH: 1 },
  { icao: "LFLS", country: "FR", utcOffsetH: 1 },
  { icao: "LFST", country: "FR", utcOffsetH: 1 },
  { icao: "LFQQ", country: "FR", utcOffsetH: 1 },
  { icao: "LFRG", country: "FR", utcOffsetH: 1 },
  { icao: "LFOT", country: "FR", utcOffsetH: 1 },
  { icao: "EGKK", country: "GB", utcOffsetH: 0 },
  { icao: "EGPH", country: "GB", utcOffsetH: 0 },
  { icao: "EDDH", country: "DE", utcOffsetH: 1 },
  { icao: "EDDB", country: "DE", utcOffsetH: 1 },
  { icao: "LIRF", country: "IT", utcOffsetH: 1 },
  { icao: "LIPZ", country: "IT", utcOffsetH: 1 },
  { icao: "LEPA", country: "ES", utcOffsetH: 1 },
  { icao: "LEMG", country: "ES", utcOffsetH: 1 },
  { icao: "LPPT", country: "PT", utcOffsetH: 0 },
  { icao: "KJFK", country: "US", utcOffsetH: -5 },
  { icao: "KBOS", country: "US", utcOffsetH: -5 },
  { icao: "KIAD", country: "US", utcOffsetH: -5 },
  { icao: "KMIA", country: "US", utcOffsetH: -5 },
  { icao: "CYUL", country: "CA", utcOffsetH: -5 },
  { icao: "TFFR", country: "FR", utcOffsetH: -4 },
  { icao: "TFFF", country: "FR", utcOffsetH: -4 },
];

/** First and last names by country: realistic, and never a real person on purpose. */
const NAMES: Record<string, { first: string[]; last: string[] }> = {
  FR: {
    first: ["Léa", "Hugo", "Camille", "Louis", "Manon", "Jules", "Chloé", "Théo", "Inès", "Nathan"],
    last: [
      "Fontaine",
      "Moreau",
      "Girard",
      "Lefèvre",
      "Roux",
      "Faure",
      "Mercier",
      "Blanc",
      "Garnier",
    ],
  },
  GB: {
    first: ["Oliver", "Amelia", "Harry", "Isla", "Jack", "Grace", "George", "Freya"],
    last: ["Hughes", "Turner", "Bennett", "Carter", "Walsh", "Fletcher", "Shaw", "Palmer"],
  },
  NL: {
    first: ["Daan", "Sanne", "Lars", "Femke", "Bram"],
    last: ["de Vries", "Bakker", "Visser", "Smit"],
  },
  DE: {
    first: ["Jonas", "Lena", "Felix", "Mia", "Lukas", "Hannah", "Paul", "Lea"],
    last: ["Weber", "Becker", "Hoffmann", "Schulz", "Koch", "Richter", "Wolf", "Krüger"],
  },
  CH: { first: ["Luca", "Noemi", "Elias", "Lara"], last: ["Keller", "Brunner", "Meier", "Frei"] },
  IT: {
    first: ["Marco", "Giulia", "Matteo", "Chiara", "Andrea", "Sara"],
    last: ["Bianchi", "Romano", "Colombo", "Ricci", "Greco", "Bruno"],
  },
  ES: {
    first: ["Pablo", "Lucía", "Javier", "Elena", "Diego", "Carmen"],
    last: ["García", "Navarro", "Ortega", "Delgado", "Castro", "Ramos"],
  },
  BE: {
    first: ["Arthur", "Louise", "Victor", "Juliette"],
    last: ["Peeters", "Janssens", "Dubois", "Lambert"],
  },
  AT: {
    first: ["Maximilian", "Anna", "Tobias", "Sophie"],
    last: ["Gruber", "Huber", "Wagner", "Pichler"],
  },
  CZ: {
    first: ["Jakub", "Tereza", "Tomáš", "Eliška"],
    last: ["Novák", "Svoboda", "Dvořák", "Černá"],
  },
  PT: {
    first: ["João", "Beatriz", "Tiago", "Inês"],
    last: ["Silva", "Santos", "Ferreira", "Costa"],
  },
  US: {
    first: ["Ethan", "Madison", "Tyler", "Olivia", "Ryan", "Emily"],
    last: ["Miller", "Davis", "Anderson", "Mitchell", "Brooks", "Reed"],
  },
  CA: {
    first: ["Félix", "Rosalie", "Mathis", "Florence"],
    last: ["Tremblay", "Gagnon", "Bouchard", "Gauthier"],
  },
  IE: { first: ["Seán", "Aoife", "Cian", "Niamh"], last: ["Murphy", "Kelly", "Byrne", "Ryan"] },
};

/** A few simulator pilots fly for real (the only declared level since the pilot ranks). */
const LEVELS: readonly [PilotLevel | null, number][] = [
  [null, 0.92],
  ["realPilot", 0.08],
];

export const pick = <T>(random: () => number, list: readonly T[]): T =>
  list[Math.floor(random() * list.length)] as T;

export function weighted<T>(random: () => number, choices: readonly (readonly [T, number])[]): T {
  let left = random();
  for (const [value, weight] of choices) {
    left -= weight;
    if (left < 0) return value;
  }
  return choices[choices.length - 1]?.[0] as T;
}

/** "Léa Fontaine", index 3 → "lea-fontaine-3": valid profile address (PilotHandle). */
function handleOf(name: string, index: number): string {
  const ascii = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${ascii.slice(0, 22)}-${index + 1}`.replace(/-+/g, "-");
}

/** `count` fictitious pilots; `publicShare` of them (0 to 1) have a public profile. */
export function identities(count: number, publicShare: number, random: () => number): Identity[] {
  const people = Array.from({ length: count }, (_, index) => {
    const home = pick(random, HOMES);
    const names = NAMES[home.country] ?? { first: ["Alex"], last: ["Martin"] };
    const firstName = pick(random, names.first);
    const lastName = pick(random, names.last);
    const name = `${firstName} ${lastName}`;
    return {
      source: { firstName, lastName, country: home.country, homeIcao: home.icao },
      identity: {
        name,
        handle: handleOf(name, index),
        country: home.country,
        homeIcao: home.icao,
        utcOffsetH: home.utcOffsetH,
        level: weighted(random, LEVELS),
        isPublic: random() < publicShare,
      },
    };
  });
  const callsigns = pseudonymsOf(
    people.map((p) => p.source),
    random,
  );
  return people.map(({ identity }, index) => ({ ...identity, callsign: callsigns[index] ?? "" }));
}
