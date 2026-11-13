import type { LiveFeed } from "./live-feed.ts";
import type { FlightsCleanupRepository } from "./repository-cleanup.ts";

/** Old simulated flights, for the page Base de données of the console (console spec). */
export class FlightsCleanupService {
  private readonly repository: FlightsCleanupRepository;
  private readonly live: Pick<LiveFeed, "closed">;

  constructor(repository: FlightsCleanupRepository, live: Pick<LiveFeed, "closed">) {
    this.repository = repository;
    this.live = live;
  }

  /** Simulated flights opened before this date: how many, and the size of their trajectories. */
  simulatedBefore(before: Date): Promise<{ count: number; bytes: number }> {
    return this.repository.simulatedBefore(before);
  }

  /** Deletes them and takes any still open off the live map. Returns how many. */
  async deleteSimulatedBefore(before: Date): Promise<number> {
    const deleted = await this.repository.deleteSimulatedBefore(before);
    for (const flightId of deleted) this.live.closed(flightId);
    return deleted.length;
  }
}
