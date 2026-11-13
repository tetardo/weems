import { FOUNDER_OFFER, type LauncherOverview } from "@weems/contrats";
import { bytes as bytesText } from "@weems/ui/format";
import { eurosText, numberText, shareOf, sinceText, trendOf, usageTone } from "./format.ts";

/**
 * What the cards right of the services say (Greg, 13/11): short lines, never wrapped (about 26
 * characters at the window's width), and a progress circle each, same size, top right. Base de
 * données over Fichiers, API over En direct: half cards, one above the other.
 */

type Tone = "ok" | "warn" | "down";
interface Line {
  text: string;
  tone?: Tone;
}
export interface Ring {
  share: number;
  tone: Tone;
  /** Under the circle: what 100 % is. */
  caption: string;
}
export interface Card {
  title: string;
  value: string;
  tone?: Tone;
  half?: boolean;
  ring?: Ring;
  lines: Line[];
}

const line = (text: string, tone?: Tone): Line => (tone ? { text, tone } : { text });

/** A resource that fills up: the circle turns orange, then red. */
const usage = (value: number, max: number, caption: string): Ring => {
  const share = shareOf(value, max);
  return { share, tone: usageTone(share), caption };
};

/** A goal to reach: the circle stays green. */
const goal = (value: number, max: number, caption: string): Ring => ({
  share: shareOf(value, max),
  tone: "ok",
  caption,
});

function databaseCard({ database }: LauncherOverview): Card {
  const { applied, expected } = database.migrations;
  return {
    title: "Base de données",
    value: bytesText(database.bytes),
    half: true,
    ring: usage(database.bytes, database.diskBytes, `de ${bytesText(database.diskBytes)}`),
    lines: [
      applied < expected
        ? line(`Migrations : ${applied}/${expected}`, "warn")
        : line(`Migrations : ${applied} à jour`),
      line(`Vols : ${numberText(database.flights.real + database.flights.simulated)}`),
    ],
  };
}

function filesCard({ files }: LauncherOverview, nowMs: number): Card {
  const { backups, disk } = files;
  const last = sinceText(backups.lastAt, nowMs);
  return {
    title: "Fichiers",
    value: bytesText(backups.bytes),
    half: true,
    ...(disk ? { ring: usage(disk.usedBytes, disk.totalBytes, "disque Mac") } : {}),
    lines: [
      line(`Sauvegardes : ${numberText(backups.count)}`),
      last ? line(`Dernière : il y a ${last}`) : line("Aucune sauvegarde", "warn"),
    ],
  };
}

function apiCard({ api }: LauncherOverview): Card {
  return {
    title: "API",
    value: api.p95Ms === null ? "—" : `${numberText(Math.round(api.p95Ms))} ms`,
    half: true,
    ring: usage(api.p95Ms ?? 0, api.slowP95Ms, `seuil ${numberText(api.slowP95Ms)} ms`),
    lines: [
      line("p95, heure en cours"),
      line(
        `Erreurs 5xx 24 h : ${numberText(api.serverErrors24h)}`,
        api.serverErrors24h > 0 ? "warn" : undefined,
      ),
    ],
  };
}

function liveCard({ api }: LauncherOverview): Card {
  const { flights, simulated } = api.live;
  return {
    title: "En direct",
    value: `${numberText(flights)} vol${flights > 1 ? "s" : ""}`,
    half: true,
    ring: usage(flights, api.liveTestedFlights, `testé à ${numberText(api.liveTestedFlights)}`),
    lines: [
      line(`Dont simulés : ${numberText(simulated)}`),
      line(`Positions : ${numberText(api.positionsLastMinute)} / min`),
    ],
  };
}

function usersCard({ users }: LauncherOverview): Card {
  const total = users.real + users.fictitious;
  return {
    title: "Utilisateurs",
    value: `${numberText(total)} actifs`,
    tone: "ok",
    ring: goal(total, FOUNDER_OFFER.places, `objectif ${FOUNDER_OFFER.places}`),
    lines: [
      line(`Réels : ${numberText(users.real)}`),
      line(`Fictifs : ${numberText(users.fictitious)}`),
      line(`Nouveaux 7 j : ${numberText(users.newLast7Days)}`),
      line(`Profils publics : ${numberText(users.publicProfiles)}`),
    ],
  };
}

function revenueCard({ revenue }: LauncherOverview): Card {
  const trend = trendOf(revenue.monthEuros, revenue.previousMonthEuros);
  return {
    title: "Revenu total",
    value: eurosText(revenue.totalEuros),
    ring: goal(revenue.monthEuros, revenue.monthGoalEuros, `budget ${revenue.monthGoalEuros} €`),
    lines: [
      line(`Ce mois : ${eurosText(revenue.monthEuros)}`),
      line(`Tendance : ${trend.text}`, trend.up ? "ok" : "down"),
      line(`Mois dernier : ${eurosText(revenue.previousMonthEuros)}`),
      ...(revenue.fictitious ? [line("Montants fictifs", "warn")] : []),
    ],
  };
}

const EMPTY: Card[] = [
  { title: "Utilisateurs" },
  { title: "Revenu total" },
  { title: "Base de données", half: true },
  { title: "Fichiers", half: true },
  { title: "API", half: true },
  { title: "En direct", half: true },
].map((card) => ({ ...card, value: "—", lines: [line("Console ou API arrêtée")] }));

/** In the order of the grid: users and revenue on top (Greg, 13/11), then the four half cards. */
export function cardsOf(overview: LauncherOverview | null, nowMs: number): Card[] {
  if (!overview) return EMPTY;
  return [
    usersCard(overview),
    revenueCard(overview),
    databaseCard(overview),
    filesCard(overview, nowMs),
    apiCard(overview),
    liveCard(overview),
  ];
}
