import type { LauncherCommand, LauncherState, RowState } from "./launcher-state.ts";
import { runningCount } from "./rows.ts";

/** Electron's MenuItemConstructorOptions, reduced to what the menu bar uses. */
export interface TrayItem {
  label?: string;
  type?: "separator";
  enabled?: boolean;
  command?: LauncherCommand | "show" | "quit";
}

const NAMES = { db: "Base de données", api: "API", site: "Site", console: "Console" } as const;
const DOTS: Record<RowState, string> = {
  running: "🟢",
  starting: "🟠",
  stopped: "⚪",
  error: "🔴",
};

function dotOf(state: LauncherState): string {
  const running = runningCount(state.rows);
  if (state.busy) return DOTS.starting;
  if (state.rows.some((row) => row.state === "error")) return DOTS.error;
  if (running === state.rows.length) return DOTS.running;
  return running === 0 ? DOTS.stopped : DOTS.starting;
}

const roundEuros = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const euros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

/**
 * « 🟢 Weems 4/4 · mois 77 € · total 307 € » next to the clock: the gains come from the console
 * (fictitious until payments exist, lot 2), left out while it does not answer.
 */
export function trayTitle(state: LauncherState): string {
  const services = `${dotOf(state)} Weems ${runningCount(state.rows)}/${state.rows.length}`;
  const revenue = state.overview?.revenue;
  if (!revenue) return services;
  const month = roundEuros.format(revenue.monthEuros);
  return `${services} · mois ${month} · total ${roundEuros.format(revenue.totalEuros)}`;
}

/** The gains, to the cent, under the services in the menu. */
function gainItems(state: LauncherState): TrayItem[] {
  const revenue = state.overview?.revenue;
  if (!revenue) return [];
  const note = revenue.fictitious ? " (fictif)" : "";
  return [
    { type: "separator" },
    { label: `Gain du mois : ${euros.format(revenue.monthEuros)}${note}`, enabled: false },
    { label: `Gain total : ${euros.format(revenue.totalEuros)}${note}`, enabled: false },
  ];
}

function headline(state: LauncherState): string {
  if (state.busy) return state.busy;
  const running = runningCount(state.rows);
  if (running === state.rows.length) return "Tout tourne";
  return running === 0 ? "Tout est arrêté" : `${running} sur ${state.rows.length} en marche`;
}

/** The menu under « Weems 4/4 » (maquette du lanceur, fiche 020). */
export function trayMenu(state: LauncherState): TrayItem[] {
  const nothingRuns = runningCount(state.rows) === 0;
  const idle = state.busy === null;
  const separator = { type: "separator" } as const;
  return [
    { label: headline(state), enabled: false },
    ...state.rows.map((row) => ({
      label: `${DOTS[row.state]}  ${NAMES[row.id]}  :${row.port}`,
      enabled: false,
    })),
    ...gainItems(state),
    separator,
    { label: "Afficher la fenêtre Weems", command: "show" },
    { label: "Ouvrir le site", command: { type: "open", target: "site" } },
    { label: "Ouvrir la console", command: { type: "open", target: "console" } },
    { label: "Ouvrir Docker Desktop", command: { type: "open", target: "docker" } },
    { label: "Ouvrir le projet dans VS Code", command: { type: "open", target: "vscode" } },
    { label: "Ouvrir Claude", command: { type: "open", target: "claude" } },
    separator,
    nothingRuns
      ? { label: "Tout démarrer", enabled: idle, command: { type: "start-all" } }
      : { label: "Tout redémarrer", enabled: idle, command: { type: "restart-all" } },
    { label: "Tout arrêter", enabled: idle && !nothingRuns, command: { type: "stop-all" } },
    separator,
    { label: "Quitter (arrête tout)", command: "quit" },
  ];
}
