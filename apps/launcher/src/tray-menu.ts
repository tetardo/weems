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

/** « 🟢 Weems 4/4 » next to the clock. */
export function trayTitle(state: LauncherState): string {
  return `${dotOf(state)} Weems ${runningCount(state.rows)}/${state.rows.length}`;
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
    separator,
    { label: "Afficher la fenêtre Weems", command: "show" },
    { label: "Ouvrir le site", command: { type: "open", target: "site" } },
    { label: "Ouvrir la console", command: { type: "open", target: "console" } },
    { label: "Ouvrir Docker Desktop", command: { type: "open", target: "docker" } },
    separator,
    nothingRuns
      ? { label: "Tout démarrer", enabled: idle, command: { type: "start-all" } }
      : { label: "Tout redémarrer", enabled: idle, command: { type: "restart-all" } },
    { label: "Tout arrêter", enabled: idle && !nothingRuns, command: { type: "stop-all" } },
    separator,
    { label: "Quitter (arrête tout)", command: "quit" },
  ];
}
