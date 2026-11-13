import type { PilotLevel } from "@weems/contrats";
import { pseudonymsOf } from "./pseudonyms.ts";

/** A fictitious pilot as the populate tool imagines it, before the API creates the account. */
export interface Identity {
  name: string;
  /** Profile address: from the name, made unique by its index. */
  handle: string;
  country: string;
  homeIcao: string;
  level: PilotLevel | null;
  /** Pseudonym flown as callsign on all the pilot's flights ("Skyhawk72", "Hugo31"). */
  callsign: string;
  isPublic: boolean;
}

/** Home airports of the fictitious pilots (in airports.json), with their country. */
const HOMES: readonly { icao: string; country: string }[] = [
  { icao: "LFPG", country: "FR" },
  { icao: "LFLL", country: "FR" },
  { icao: "LFMN", country: "FR" },
  { icao: "LFBO", country: "FR" },
  { icao: "LFBD", country: "FR" },
  { icao: "LFSB", country: "FR" },
  { icao: "EGLL", country: "GB" },
  { icao: "EGCC", country: "GB" },
  { icao: "EHAM", country: "NL" },
  { icao: "EDDF", country: "DE" },
  { icao: "EDDM", country: "DE" },
  { icao: "EDDL", country: "DE" },
  { icao: "LSZH", country: "CH" },
  { icao: "LIMC", country: "IT" },
  { icao: "LEMD", country: "ES" },
  { icao: "LEBL", country: "ES" },
  { icao: "EBBR", country: "BE" },
  { icao: "LOWW", country: "AT" },
  { icao: "LKPR", country: "CZ" },
  { icao: "EIDW", country: "IE" },
  { icao: "LFPO", country: "FR" },
  { icao: "LFPB", country: "FR" },
  { icao: "LFRS", country: "FR" },
  { icao: "LFRB", country: "FR" },
  { icao: "LFBH", country: "FR" },
  { icao: "LFBP", country: "FR" },
  { icao: "LFBZ", country: "FR" },
  { icao: "LFMT", country: "FR" },
  { icao: "LFML", country: "FR" },
  { icao: "LFKJ", country: "FR" },
  { icao: "LFLC", country: "FR" },
  { icao: "LFLS", country: "FR" },
  { icao: "LFST", country: "FR" },
  { icao: "LFQQ", country: "FR" },
  { icao: "LFRG", country: "FR" },
  { icao: "LFOT", country: "FR" },
  { icao: "EGKK", country: "GB" },
  { icao: "EGPH", country: "GB" },
  { icao: "EDDH", country: "DE" },
  { icao: "EDDB", country: "DE" },
  { icao: "LIRF", country: "IT" },
  { icao: "LIPZ", country: "IT" },
  { icao: "LEPA", country: "ES" },
  { icao: "LEMG", country: "ES" },
  { icao: "LPPT", country: "PT" },
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
