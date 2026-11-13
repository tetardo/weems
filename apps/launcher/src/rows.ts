import type { LifecycleStatus, LocalServiceStatus } from "@weems/contrats";
import type { ProcessStatus } from "@weems/local-process";
import type { Row } from "./launcher-state.ts";

const PORTS = { db: 5432, api: 3000, site: 3001, console: 3002 } as const;

function serviceNote(service: LocalServiceStatus): string | null {
  if (service.error) return service.error;
  if (service.runner === "outside")
    return "Lancé hors de la console : arrêtez-le dans son terminal.";
  return null;
}

/** The database, the API and the site as the console sees them; stopped when it does not answer. */
function serviceRows(status: LifecycleStatus | null): Row[] {
  return (["db", "api", "site"] as const).map((id) => {
    const service = status?.services.find((candidate) => candidate.id === id);
    if (!service) return { id, state: "stopped", port: PORTS[id], since: null, note: null };
    const { state, port, since } = service;
    return { id, state, port, since, note: serviceNote(service) };
  });
}

export interface ConsoleFacts {
  /** The console answered the last reading. */
  answers: boolean;
  /** The console started by the launcher, if any. */
  process: ProcessStatus;
  /** The launcher asked to stop everything: a console that ends is no error then. */
  stopAsked: boolean;
}

/** The console row: the launcher's own process, or a console started elsewhere (start.sh). */
export function consoleRow({ answers, process, stopAsked }: ConsoleFacts): Row {
  const row = { id: "console", port: PORTS.console, since: process.startedAt, note: null } as const;
  if (answers && process.running) return { ...row, state: "running" };
  if (answers) return { ...row, state: "running", since: null, note: "Lancée hors du lanceur." };
  if (process.running) return { ...row, state: "starting" };
  const failed = !stopAsked && process.exitCode !== null && process.exitCode !== 0;
  if (failed) {
    const note = `La console s'est arrêtée (code ${process.exitCode}) : voir ses journaux.`;
    return { ...row, state: "error", since: null, note };
  }
  return { ...row, state: "stopped", since: null };
}

export function rowsOf(status: LifecycleStatus | null, console: ConsoleFacts): Row[] {
  return [...serviceRows(status), consoleRow(console)];
}

/** « 3/4 » in the menu bar: rows running. */
export function runningCount(rows: readonly Row[]): number {
  return rows.filter((row) => row.state === "running").length;
}
