import { join } from "node:path";
import { Account } from "../account/account.ts";
import { fetchLoginSettings } from "../account/browser-login.ts";
import { type Cipher, encryptedFileStore } from "../account/token-store.ts";
import type { SimLink } from "../connectors/msfs/sim-link.ts";
import { startMsfsTracker } from "../runtime/msfs-tracker.ts";
import { httpApiClient } from "../sender/api-client.ts";
import { lastClosedFlight } from "../storage/last-flight.ts";
import type { AppState, FlightSettings } from "./app-state.ts";
import { FlightSettingsSchema, flightPlanOf, loadSettings, saveSettings } from "./settings-file.ts";

export interface DesktopTrackerOptions {
  apiUrl: string;
  version: string;
  /** Folder of the tracker's own files (Electron: app.getPath("userData")). */
  dataDir: string;
  /** Simulator link: SimConnect on Windows. */
  newLink: () => SimLink;
  openBrowser: (url: string) => Promise<void>;
  /** System encryption of the tokens (Electron: safeStorage). */
  cipher: Cipher;
  now: () => number;
  utcNow: () => number;
}

/**
 * The desktop tracker without its window: account, MSFS tracker, flight settings.
 * Everything the window shows comes from `state()`. Runs and is tested without Electron.
 */
export class DesktopTracker {
  private readonly options: DesktopTrackerOptions;
  private readonly account: Account;
  private readonly settingsPath: string;
  private settings: FlightSettings;
  private tracker: ReturnType<typeof startMsfsTracker>;
  private simulator: AppState["simulator"] = "disconnected";
  private aircraft: string | null = null;
  private loggingIn = false;
  private notice: string | null = null;

  constructor(options: DesktopTrackerOptions) {
    this.options = options;
    this.account = new Account(
      options.apiUrl,
      encryptedFileStore(join(options.dataDir, "account.bin"), options.cipher),
      options.utcNow,
    );
    this.settingsPath = join(options.dataDir, "settings.json");
    this.settings = loadSettings(this.settingsPath);
    this.tracker = this.startTracker();
  }

  state(): AppState {
    const { runtime, sender, recorder } = this.tracker.tracker;
    const last = lastClosedFlight(recorder.db);
    const flightId = runtime.currentFlightId;
    return {
      version: this.options.version,
      apiUrl: this.options.apiUrl,
      loggedIn: this.account.loggedIn,
      loggingIn: this.loggingIn,
      simulator: this.simulator,
      aircraft: this.aircraft,
      flight: flightId ? { id: flightId, phase: runtime.currentPhase } : null,
      pending: sender.pendingCount(),
      blocked: sender.block,
      settings: this.settings,
      flightPlanMissing: flightPlanOf(this.settings) === null,
      lastFlight: last && { ...last, delivery: sender.deliveryOf(last.flightId) },
      notice: this.notice,
    };
  }

  /** Opens the browser; the pilot logs in there, then sending starts again. */
  async logIn(): Promise<void> {
    this.loggingIn = true;
    this.notice = null;
    try {
      await this.account.logIn(this.options.openBrowser);
      this.tracker.tracker.sender.resumeAfterLogin();
    } catch {
      this.notice = "loginFailed";
    } finally {
      this.loggingIn = false;
    }
  }

  logOut(): void {
    this.account.logOut();
  }

  /** Callsign and flight plan apply to the next flight: refused while a flight is recorded. */
  async saveSettings(settings: FlightSettings): Promise<void> {
    const parsed = FlightSettingsSchema.safeParse(settings);
    if (!parsed.success || this.tracker.tracker.runtime.currentFlightId) {
      this.notice = parsed.success ? "flightInProgress" : "invalidSettings";
      return;
    }
    this.notice = null;
    saveSettings(this.settingsPath, parsed.data);
    this.settings = parsed.data;
    await this.tracker.stop();
    this.tracker = this.startTracker();
  }

  closeFlight(): void {
    this.tracker.closeFlight();
  }

  /** The site's address comes from the API, like the login settings: nothing is hard-coded. */
  async openReport(): Promise<void> {
    const last = lastClosedFlight(this.tracker.tracker.recorder.db);
    if (!last) return;
    this.notice = null;
    try {
      const { siteUrl } = await fetchLoginSettings(this.options.apiUrl);
      await this.options.openBrowser(new URL(`/flights/${last.flightId}`, siteUrl).toString());
    } catch {
      this.notice = "reportUnavailable";
    }
  }

  /** Returns the number of messages left for the next launch. */
  stop(): Promise<number> {
    return this.tracker.stop();
  }

  private startTracker() {
    const tracker = startMsfsTracker({
      link: this.options.newLink(),
      api: httpApiClient({
        baseUrl: this.options.apiUrl,
        token: () => this.account.accessToken(),
        trackerVersion: this.options.version,
      }),
      databasePath: join(this.options.dataDir, "tracker.db"),
      callsign: this.settings.callsign,
      flightPlan: flightPlanOf(this.settings),
      trackerVersion: this.options.version,
      report: () => undefined,
      now: this.options.now,
      utcNow: this.options.utcNow,
    });
    this.simulator = "disconnected";
    tracker.connector.onStatus((status) => (this.simulator = status));
    tracker.connector.onAircraft((aircraft) => (this.aircraft = aircraft.title));
    return tracker;
  }
}
