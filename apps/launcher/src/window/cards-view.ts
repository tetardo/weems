import type { LauncherOverview } from "@weems/contrats";
import { bytes as bytesText } from "@weems/ui/format";
import { eurosText, numberText, trendOf } from "./format.ts";
import { element } from "./rows-view.ts";

/**
 * The four cards right of the services: four short lines each, never wrapped (Greg, 13/11).
 * A line holds at most about 26 characters at the window's width.
 */

type Tone = "ok" | "warn" | "down";
interface Line {
  text: string;
  tone?: Tone;
}
interface Card {
  title: string;
  value: string;
  tone?: Tone;
  badge?: string;
  lines: Line[];
}

const line = (text: string, tone?: Tone): Line => (tone ? { text, tone } : { text });

function databaseCard({ database }: LauncherOverview): Card {
  const { applied, expected } = database.migrations;
  const behind = applied < expected;
  const largest = database.largestTable;
  return {
    title: "Base de données",
    value: bytesText(database.bytes),
    lines: [
      behind
        ? line(`Migrations : ${applied}/${expected}`, "warn")
        : line(`Migrations : ${applied} à jour`),
      line(`Vols réels : ${numberText(database.flights.real)}`),
      line(`Vols simulés : ${numberText(database.flights.simulated)}`),
      line(largest ? `${largest.name} : ${bytesText(largest.bytes)}` : "Aucune table"),
    ],
  };
}

function apiCard({ api }: LauncherOverview): Card {
  return {
    title: "API",
    value: api.p95Ms === null ? "—" : `${numberText(Math.round(api.p95Ms))} ms`,
    lines: [
      line("p95, heure en cours"),
      line(
        `Erreurs 5xx 24 h : ${numberText(api.serverErrors24h)}`,
        api.serverErrors24h > 0 ? "warn" : undefined,
      ),
      line(`Positions : ${numberText(api.positionsLastMinute)} / min`),
      line(`En direct : ${numberText(api.live.flights)} (${numberText(api.live.simulated)} sim.)`),
    ],
  };
}

function usersCard({ users }: LauncherOverview): Card {
  return {
    title: "Utilisateurs actifs",
    value: numberText(users.real + users.fictitious),
    tone: "ok",
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
    ...(revenue.fictitious ? { badge: "Fictif" } : {}),
    lines: [
      line(`Ce mois : ${eurosText(revenue.monthEuros)} ${trend.text}`, trend.up ? "ok" : "down"),
      line(`Mois dernier : ${eurosText(revenue.previousMonthEuros)}`),
      line(revenue.fictitious ? "Exemple, pas de paiement" : "Paiements reçus"),
      line("Paiements au lot 2"),
    ],
  };
}

function renderCard(card: Card): HTMLElement {
  const box = element("section", "card");
  const title = element("h2", "card-title", card.title);
  if (card.badge) title.append(element("span", "badge", card.badge));
  const value = element("div", `card-value ${card.tone ?? ""}`, card.value);
  const lines = card.lines.map(({ text, tone }) => element("p", `card-line ${tone ?? ""}`, text));
  box.append(title, value, ...lines);
  return box;
}

const EMPTY: Card[] = ["Base de données", "API", "Utilisateurs actifs", "Revenu total"].map(
  (title) => ({ title, value: "—", lines: [line("Console ou API arrêtée")] }),
);

export function renderCards(overview: LauncherOverview | null): void {
  const cards = overview
    ? [databaseCard(overview), apiCard(overview), usersCard(overview), revenueCard(overview)]
    : EMPTY;
  document.getElementById("cards")?.replaceChildren(...cards.map(renderCard));
}
