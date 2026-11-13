import {
  LauncherOverview,
  type LifecycleRequest,
  LifecycleStatus,
  LOCAL_SCRIPT_HEADER,
  type LocalServiceId,
} from "@weems/contrats";

const HEADERS = { [LOCAL_SCRIPT_HEADER]: "1", "content-type": "application/json" };
/** Reading: the console compiles the route on its first call, hence more than a second. */
const STATUS_TIMEOUT_MS = 10_000;
/** Stopping waits for the simulation in progress (its flights are closed). */
const ACTION_TIMEOUT_MS = 180_000;

/** The console's route /api/lifecycle (apps/console), the one the scripts of scripts/mac/ call. */
export class ConsoleClient {
  private readonly url: string;

  private readonly overviewUrl: string;

  constructor(consoleUrl: string) {
    this.url = `${consoleUrl}/api/lifecycle`;
    this.overviewUrl = `${consoleUrl}/api/overview`;
  }

  /** The four cards (route /api/overview, from Supervision); null when they cannot be read. */
  async overview(): Promise<LauncherOverview | null> {
    return this.read(this.overviewUrl, LauncherOverview);
  }

  /** The services, and the logs of one when asked; null when the console does not answer. */
  async status(logsOf: LocalServiceId | null): Promise<LifecycleStatus | null> {
    const query = logsOf ? `?logs=${logsOf}` : "";
    return this.read(this.url + query, LifecycleStatus);
  }

  private async read<T>(url: string, schema: { parse(data: unknown): T }): Promise<T | null> {
    try {
      const response = await fetch(url, {
        headers: HEADERS,
        signal: AbortSignal.timeout(STATUS_TIMEOUT_MS),
      });
      if (!response.ok) return null;
      return schema.parse(await response.json());
    } catch {
      return null;
    }
  }

  async answers(): Promise<boolean> {
    return (await this.status(null)) !== null;
  }

  /** Throws the console's own words when it refuses (port held by another program…). */
  async send(request: LifecycleRequest): Promise<void> {
    const response = await fetch(this.url, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(ACTION_TIMEOUT_MS),
    });
    if (response.ok) return;
    const body = (await response.json().catch(() => ({}))) as { error?: unknown };
    throw new Error(typeof body.error === "string" ? body.error : `Console : ${response.status}`);
  }
}
