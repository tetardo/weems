import type { LauncherOverview } from "@weems/contrats";
import { bytes as bytesText } from "@weems/ui/format";
import { eurosText, numberText } from "./format.ts";
import { element } from "./rows-view.ts";

/** The four cards right of the services (maquette validée par Greg, 13/11). */

interface Card {
  title: string;
  value: string;
  tone?: "ok" | "warn";
  badge?: string;
  lines: string[];
}

function databaseCard({ database }: LauncherOverview): Card {
  const { applied, expected } = database.migrations;
  const behind = applied < expected;
  const largest = database.largestTable;
  return {
    title: "Base de données",
    value: bytesText(database.bytes),
    lines: [
      largest
        ? `Plus grosse table : ${largest.name} (${bytesText(largest.bytes)})`
        : "Aucune table",
      behind
        ? `Migrations : ${applied} sur ${expected}, à appliquer`
        : `Migrations : ${applied} à jour`,
      `Vols : ${numberText(database.flights.real)} réels · ${numberText(database.flights.simulated)} simulés`,
    ],
    ...(behind ? { tone: "warn" as const } : {}),
  };
}

function apiCard({ api }: LauncherOverview): Card {
  return {
    title: "API",
    value: api.p95Ms === null ? "—" : `${numberText(Math.round(api.p95Ms))} ms`,
    lines: [
      "Temps de réponse p95, heure en cours",
      `Erreurs 5xx sur 24 h : ${numberText(api.serverErrors24h)}`,
      `Positions : ${numberText(api.positionsLastMinute)} / min`,
      `En direct : ${numberText(api.live.flights)} vols (${numberText(api.live.simulated)} simulés)`,
    ],
    ...(api.serverErrors24h > 0 ? { tone: "warn" as const } : {}),
  };
}

function usersCard({ users }: LauncherOverview): Card {
  return {
    title: "Utilisateurs actifs",
    value: numberText(users.real + users.fictitious),
    tone: "ok",
    lines: [
      `Réels ${numberText(users.real)} · fictifs ${numberText(users.fictitious)}`,
      `Nouveaux sur 7 j : ${numberText(users.newLast7Days)}`,
      `Profils publics : ${numberText(users.publicProfiles)}`,
    ],
  };
}

function revenueCard({ revenue }: LauncherOverview): Card {
  return {
    title: "Revenu total",
    value: eurosText(revenue.totalEuros),
    ...(revenue.fictitious ? { badge: "Fictif" } : {}),
    lines: [
      `Ce mois-ci : ${eurosText(revenue.monthEuros)}`,
      revenue.fictitious ? "Exemple : aucun paiement réel" : "Paiements reçus",
    ],
  };
}

function renderCard(card: Card): HTMLElement {
  const box = element("section", "card");
  const title = element("h2", "card-title", card.title);
  if (card.badge) title.append(element("span", "badge", card.badge));
  const value = element("div", `card-value ${card.tone ?? ""}`, card.value);
  box.append(title, value, ...card.lines.map((line) => element("p", "card-line", line)));
  return box;
}

const EMPTY: Card[] = ["Base de données", "API", "Utilisateurs actifs", "Revenu total"].map(
  (title) => ({ title, value: "—", lines: ["La console ou l'API ne répond pas."] }),
);

export function renderCards(overview: LauncherOverview | null): void {
  const cards = overview
    ? [databaseCard(overview), apiCard(overview), usersCard(overview), revenueCard(overview)]
    : EMPTY;
  document.getElementById("cards")?.replaceChildren(...cards.map(renderCard));
}
