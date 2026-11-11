import { DevFlightCounts, DevMetrics } from "@weems/contrats";
import type { ConsoleConfig } from "../console-config.ts";

/**
 * Development routes of the API, called with the fixed development token: the simulated
 * flights belong to the development pilot (spec admin, page Trafic simulé).
 */
export class DevApi {
  private readonly config: ConsoleConfig;

  constructor(config: ConsoleConfig) {
    this.config = config;
  }

  private request(path: string, method = "GET"): Promise<Response> {
    return fetch(new URL(path, this.config.apiUrl), {
      method,
      headers: { authorization: `Bearer ${this.config.devToken}` },
      signal: AbortSignal.timeout(3_000),
    });
  }

  /** Null when the API does not answer: the page says so instead of failing. */
  async metrics(): Promise<DevMetrics | null> {
    try {
      const response = await this.request("/v1/dev/metrics");
      return response.ok ? DevMetrics.parse(await response.json()) : null;
    } catch {
      return null;
    }
  }

  async counts(): Promise<DevFlightCounts | null> {
    try {
      const response = await this.request("/v1/dev/flight-counts");
      return response.ok ? DevFlightCounts.parse(await response.json()) : null;
    } catch {
      return null;
    }
  }

  /** Simulated flights only (simulator "replay"): flights of pnpm fly are never deleted. */
  async deleteSimulated(): Promise<void> {
    const response = await this.request("/v1/flights?simulator=replay", "DELETE");
    if (response.status !== 204) throw new Error(`L'API a répondu ${response.status}.`);
  }
}
