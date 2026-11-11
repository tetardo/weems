import type { FlightPhase } from "@weems/contrats";
import type { ConnectorStatus } from "../core/connector.ts";
import type { Delivery, LastFlight } from "../core/last-flight.ts";

/** What the pilot sets before flying; departure and arrival are required to fly (decision 007). */
export interface FlightSettings {
  callsign: string;
  departureIcao: string;
  arrivalIcao: string;
}

/**
 * Everything the window shows, sent by the main process once per second
 * (architecture interne, part 7: the window only displays).
 */
export interface AppState {
  version: string;
  apiUrl: string;
  loggedIn: boolean;
  /** A login in the browser is waiting for the pilot. */
  loggingIn: boolean;
  /** MSFS: running and read, loading a flight, or not found. */
  simulator: ConnectorStatus;
  aircraft: string | null;
  flight: { id: string; phase: FlightPhase | null } | null;
  /** Messages recorded but not yet accepted by the API. */
  pending: number;
  /** Why sending stopped: login needed, or tracker too old. */
  blocked: "unauthorized" | "upgradeRequired" | null;
  settings: FlightSettings;
  /** Departure or arrival not entered yet: no flight can open. */
  flightPlanMissing: boolean;
  /** Short report of the last closed flight; the full one is on the site once sent. */
  lastFlight: (LastFlight & { delivery: Delivery }) | null;
  /** Last problem to show (login failed, settings refused…), null when none. */
  notice: string | null;
}

/** Calls from the window to the main process (preload.ts exposes them as window.weems). */
export interface AppCommands {
  logIn(): Promise<void>;
  logOut(): Promise<void>;
  saveSettings(settings: FlightSettings): Promise<void>;
  closeFlight(): Promise<void>;
  /** Opens the report of the last flight on the site, in the pilot's browser. */
  openReport(): Promise<void>;
  onState(listener: (state: AppState) => void): void;
}

/** IPC channel names, shared by main.ts and preload.ts. */
export const CHANNELS = {
  state: "weems:state",
  logIn: "weems:log-in",
  logOut: "weems:log-out",
  saveSettings: "weems:save-settings",
  closeFlight: "weems:close-flight",
  openReport: "weems:open-report",
} as const;
