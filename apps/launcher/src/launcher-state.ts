/** Shared by the main process, the preload and the window: what the window shows and can ask. */

/** The four rows of the window, and the tabs of the logs. */
export type RowId = "db" | "api" | "site" | "console";
export type RowState = "running" | "starting" | "stopped" | "error";
export type ServiceAction = "start" | "stop" | "restart";

export interface Row {
  id: RowId;
  state: RowState;
  port: number;
  /** Start time when known (ISO), to show « 20 min ». */
  since: string | null;
  /** Why it failed, or why its buttons cannot act (« lancé hors de la console »). */
  note: string | null;
}

/** Everything the window shows, sent by the main process at each change. */
export interface LauncherState {
  rows: Row[];
  /** What the launcher is doing (« Démarrage… »): buttons wait meanwhile. Null when idle. */
  busy: string | null;
  /** Last problem to show, null when none. */
  notice: string | null;
  tab: RowId;
  logs: string[];
}

/** Pages opened in the browser, or Docker Desktop. */
export type LinkTarget = "site" | "console" | "traffic" | "activity" | "docker";

export type LauncherCommand =
  | { type: "start-all" }
  | { type: "stop-all" }
  | { type: "restart-all" }
  | { type: "service"; action: ServiceAction; id: RowId }
  | { type: "open"; target: LinkTarget }
  | { type: "tab"; tab: RowId };

/** Calls from the window to the main process (preload.ts exposes them as window.weems). */
export interface LauncherBridge {
  send(command: LauncherCommand): void;
  onState(listener: (state: LauncherState) => void): void;
}

export const CHANNELS = { command: "weems:command", state: "weems:state" } as const;
