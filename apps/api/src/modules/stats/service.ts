import type { SiteStats } from "@weems/contrats";

/** What the stats need from the other modules, through their services. */
export interface StatsSources {
  countPilots(): Promise<number>;
  countFlights(): Promise<number>;
  countLiveFlights(): number;
}

/** Counters of the public home page (spec J4 accueil). */
export class StatsService {
  private readonly sources: StatsSources;

  constructor(sources: StatsSources) {
    this.sources = sources;
  }

  async stats(): Promise<SiteStats> {
    const [pilots, flights] = await Promise.all([
      this.sources.countPilots(),
      this.sources.countFlights(),
    ]);
    return { pilots, flights, liveFlights: this.sources.countLiveFlights() };
  }
}
