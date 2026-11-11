import type { PilotLevel } from "@weems/contrats";

/** A fictitious pilot as the populate tool imagines it, before the API creates the account. */
export interface Identity {
  name: string;
  /** Profile address: from the name, made unique by its index. */
  handle: string;
  country: string;
  homeIcao: string;
  level: PilotLevel;
  callsign: string;
  isPublic: boolean;
}

/** Home airports of the fleet (tools/generate-flights/fleet.ts), with their country. */
export const HOMES: readonly { icao: string; country: string }[] = [
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
  IE: { first: ["Seán", "Aoife", "Cian", "Niamh"], last: ["Murphy", "Kelly", "Byrne", "Ryan"] },
};

/** Most simulator pilots call themselves intermediate; a few fly for real. */
const LEVELS: readonly [PilotLevel, number][] = [
  ["beginner", 0.25],
  ["intermediate", 0.45],
  ["advanced", 0.22],
  ["realPilot", 0.08],
];

export const pick = <T>(random: () => number, list: readonly T[]): T =>
  list[Math.floor(random() * list.length)] as T;

function weighted<T>(random: () => number, choices: readonly (readonly [T, number])[]): T {
  let left = random();
  for (const [value, weight] of choices) {
    left -= weight;
    if (left < 0) return value;
  }
  return choices[choices.length - 1]?.[0] as T;
}

/** "Léa Fontaine", index 3 → "lea-fontaine-3": valid profile address (PilotHandle). */
export function handleOf(name: string, index: number): string {
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
  return Array.from({ length: count }, (_, index) => {
    const home = pick(random, HOMES);
    const names = NAMES[home.country] ?? { first: ["Alex"], last: ["Martin"] };
    const name = `${pick(random, names.first)} ${pick(random, names.last)}`;
    return {
      name,
      handle: handleOf(name, index),
      country: home.country,
      homeIcao: home.icao,
      level: weighted(random, LEVELS),
      callsign: `WMS${String(200 + index).padStart(3, "0")}`,
      isPublic: random() < publicShare,
    };
  });
}
