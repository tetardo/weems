import { FictitiousPopulation } from "@weems/contrats";
import type { ConsoleConfig } from "../console-config.ts";

const PATH = "/v1/dev/fictitious-pilots";

/** Development routes of the fictitious population, with the development token. */
export class FictitiousApi {
  private readonly config: ConsoleConfig;

  constructor(config: ConsoleConfig) {
    this.config = config;
  }

  private request(method: string, timeoutMs: number): Promise<Response> {
    return fetch(new URL(PATH, this.config.apiUrl), {
      method,
      headers: { authorization: `Bearer ${this.config.devToken}` },
      signal: AbortSignal.timeout(timeoutMs),
    });
  }

  /** Null when the API does not answer: the page says so instead of failing. */
  async population(): Promise<FictitiousPopulation | null> {
    try {
      const response = await this.request("GET", 3_000);
      return response.ok ? FictitiousPopulation.parse(await response.json()) : null;
    } catch {
      return null;
    }
  }

  /** Accounts, their flights, profiles and photos; never a real account (console spec). */
  async deleteAll(): Promise<void> {
    const response = await this.request("DELETE", 120_000);
    if (!response.ok) throw new Error(`L'API a répondu ${response.status}.`);
  }
}
