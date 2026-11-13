import type { SupervisionEvent, SupervisionHealth } from "@weems/contrats";

/** Numbers and sentences of the page Supervision, in French. Pure: tested apart. */

const fr = (value: number, digits = 0) =>
  value.toLocaleString("fr-FR", { maximumFractionDigits: digits });

export const plural = (n: number, word: string) => `${fr(n)} ${word}${n > 1 ? "s" : ""}`;

/** « +3 sur 7 j », or « = sur 7 j » when nothing changed. */
export const weekDelta = (n: number) => (n > 0 ? `+${fr(n)} sur 7 j` : "= sur 7 j");

/** « 22 h », « 1,5 h ». */
export const hours = (value: number) => `${fr(value, value < 10 ? 1 : 0)} h`;

/** Heights of bars in % of the tallest, at least `min` % so that a small value stays visible. */
export function barHeights(values: readonly number[], min = 4): number[] {
  const max = Math.max(...values, 0);
  return values.map((value) => (max === 0 || value === 0 ? 0 : Math.max(min, (value / max) * 100)));
}

/** Share of each total, whole %, the largest first as given. */
export function shares(counts: readonly number[]): number[] {
  const total = counts.reduce((sum, n) => sum + n, 0);
  return counts.map((n) => (total === 0 ? 0 : Math.round((n / total) * 100)));
}

const versionParts = (version: string) => version.split(".").map((part) => Number(part) || 0);

/** The newest version name (numeric order: 0.10.0 after 0.9.0). */
export function newestVersion(versions: readonly string[]): string | null {
  return (
    [...versions].sort((a, b) => {
      const [x, y] = [versionParts(a), versionParts(b)];
      for (let i = 0; i < Math.max(x.length, y.length); i += 1) {
        const diff = (y[i] ?? 0) - (x[i] ?? 0);
        if (diff !== 0) return diff;
      }
      return 0;
    })[0] ?? null
  );
}

/** Worst p95 of the last 24 h and every server error, for the line above the chart. */
export function apiSummary(apiHours: SupervisionHealth["apiHours"]) {
  const p95s = apiHours.flatMap((hour) => (hour.p95Ms === null ? [] : [hour.p95Ms]));
  return {
    lastP95Ms: apiHours.at(-1)?.p95Ms ?? null,
    worstP95Ms: p95s.length > 0 ? Math.max(...p95s) : null,
    serverErrors: apiHours.reduce((sum, hour) => sum + hour.serverErrors, 0),
  };
}

/** An hour is slow from 500 ms at the 95th percentile: shown in orange. */
export const SLOW_P95_MS = 500;

const route = (flight: NonNullable<SupervisionEvent["flight"]>) =>
  flight.from || flight.to ? ` · ${flight.from ?? "?"} → ${flight.to ?? "?"}` : "";

/** « Vol ouvert · AFR42K · LFPG → EGLL · Léa ». */
export function eventText(event: SupervisionEvent): string {
  const who = event.pilot ?? "";
  switch (event.kind) {
    case "accountCreated":
      return `Nouveau compte · ${who}`;
    case "accountDisabled":
      return `Compte désactivé · ${who}`;
    case "invitationCreated":
      return "Invitation créée";
    case "profilePublished":
      return `Profil publié · ${who}`;
    case "flightOpened":
    case "flightClosed": {
      const verb = event.kind === "flightOpened" ? "Vol ouvert" : "Vol clos";
      const flight = event.flight ? ` · ${event.flight.callsign}${route(event.flight)}` : "";
      return `${verb}${flight} · ${who}`;
    }
  }
}

/** « Base à jour », or how many migrations are missing (pnpm --filter @weems/api db:migrate). */
export function migrationsText({ applied, expected }: SupervisionHealth["migrations"]): string {
  if (applied >= expected) return "Migrations à jour";
  return `${plural(expected - applied, "migration")} en retard`;
}
