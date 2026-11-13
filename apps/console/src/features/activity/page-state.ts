import type { ActivityView } from "../../server/activity/activity-view.ts";

export interface PageState {
  active: boolean;
  /** Fictitious accounts in the base now. */
  accounts: number;
  /** Public profile to open from the links of the page. */
  sampleHandle: string | null;
  /** Launch buttons off: a run here or on the page Trafic, the API down, an action pending. */
  populationOff: boolean;
  liveOff: boolean;
  populationNote: string;
  liveNote: string;
}

const API_DOWN = "L'API ne répond pas.";
const RUNNING = "Un lancement est en cours.";
const TRAFFIC = "Un lancement est en cours sur la page Trafic simulé.";

function blocker(view: ActivityView | null, active: boolean): string | null {
  if (!view?.population) return API_DOWN;
  if (active) return RUNNING;
  if (view.trafficBusy) return TRAFFIC;
  return null;
}

const isActive = (view: ActivityView | null) =>
  view?.run !== null && view?.run !== undefined && view.run.state !== "ended";

function liveNoteOf(blocked: string | null, accounts: number): string {
  if (blocked) return blocked;
  return accounts === 0
    ? "Il faut d'abord une population fictive."
    : "Vols des comptes fictifs, à leur nom.";
}

/** What the page Activité simulée allows now, and why not (shown next to the buttons). */
export function pageStateOf(view: ActivityView | null, busy: boolean): PageState {
  const active = isActive(view);
  const blocked = blocker(view, active);
  const accounts = view?.population?.accounts ?? 0;
  const off = busy || blocked !== null;
  return {
    active,
    accounts,
    sampleHandle: view?.population?.busiestHandle ?? null,
    populationOff: off,
    liveOff: off || accounts === 0,
    populationNote: blocked ?? "Comptes réels et vols MSFS jamais touchés.",
    liveNote: liveNoteOf(blocked, accounts),
  };
}
