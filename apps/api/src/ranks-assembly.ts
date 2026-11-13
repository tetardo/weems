import type { FastifyInstance } from "fastify";
import type { FlightsService } from "./modules/flights/service.ts";
import type { PublicProfilesService } from "./modules/profiles/public-service.ts";
import { registerRankRoutes } from "./modules/ranks/routes.ts";
import { RanksService } from "./modules/ranks/service.ts";
import type { TracksService } from "./modules/tracks/service.ts";
import type { Guards } from "./plugins/auth.ts";

export interface RankSources {
  guards: Guards;
  flights: FlightsService;
  tracks: TracksService;
  publicProfiles: PublicProfilesService;
}

/**
 * Pilot ranks (spec grades des pilotes): the pilot's route, the rank shown on public pages and the
 * live map, and the end of a flight that may change it.
 */
export function registerRanks(app: FastifyInstance, sources: RankSources): void {
  const { guards, flights, tracks, publicProfiles } = sources;
  const ranks = new RanksService(flights, tracks);
  tracks.whenCompleted((pilotId) => {
    ranks.flightCompleted(pilotId);
    return Promise.resolve();
  });
  publicProfiles.showRanks((ids) => ranks.publicOf(ids));
  registerRankRoutes(app, ranks, guards);
}
