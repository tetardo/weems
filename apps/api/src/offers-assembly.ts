import type { FastifyInstance } from "fastify";
import type { DatabaseHandle } from "./db/client.ts";
import type { AccountsService } from "./modules/accounts/service.ts";
import type { FlightsService } from "./modules/flights/service.ts";
import { FoundersRepository } from "./modules/founders/repository.ts";
import { registerAdminFounderRoutes, registerFounderRoutes } from "./modules/founders/routes.ts";
import { FoundersService } from "./modules/founders/service.ts";
import { registerAdminOfferRoutes } from "./modules/offers/admin-routes.ts";
import { AmbassadorsService } from "./modules/offers/ambassadors-service.ts";
import { AmbassadorsRepository } from "./modules/offers/repository-ambassadors.ts";
import { OffersRepository } from "./modules/offers/repository.ts";
import { registerAmbassadorRoutes, registerOfferRoutes } from "./modules/offers/routes.ts";
import { OffersService } from "./modules/offers/service.ts";
import type { PlansService } from "./modules/plans/service.ts";
import type { PublicProfilesService } from "./modules/profiles/public-service.ts";
import type { TracksService } from "./modules/tracks/service.ts";
import type { Guards } from "./plugins/auth.ts";

export interface OfferSources {
  database: DatabaseHandle;
  guards: Guards;
  accounts: AccountsService;
  flights: FlightsService;
  tracks: TracksService;
  plans: PlansService;
  publicProfiles: PublicProfilesService;
}

/**
 * Founder offer, offer codes and ambassadors (spec offre fondateurs): their routes, and what
 * they plug into other modules (sign-up codes, end of a flight, founder badges).
 */
export function registerOffers(app: FastifyInstance, sources: OfferSources): void {
  const { database, guards, accounts, flights, tracks, plans, publicProfiles } = sources;
  const offers = new OffersService(new OffersRepository(database.db), plans);
  const publicPilots = (ids: string[]) => publicProfiles.livePilots(ids);
  const ambassadors = new AmbassadorsService({
    repository: new AmbassadorsRepository(database.db),
    offers,
    publicPilots,
    pilotIdOf: (handle) => publicProfiles.pilotIdOf(handle),
  });
  const founders = new FoundersService({
    repository: new FoundersRepository(database.db),
    flights,
    tracks,
    accounts,
    plans,
    referral: {
      issue: (pilotId) => offers.issueReferral(pilotId),
      withdraw: (pilotId) => offers.withdrawReferral(pilotId),
    },
    publicPilots,
  });
  accounts.acceptOfferCodes(offers);
  tracks.whenCompleted(async (pilotId) => {
    try {
      await founders.flightCompleted(pilotId);
    } catch (err) {
      app.log.error({ err }, "Founder offer not checked after a flight");
    }
  });
  publicProfiles.showFounders((ids) => founders.confirmedNumbers(ids));
  registerFounderRoutes(app, founders, guards);
  registerAdminFounderRoutes(app, founders, guards);
  registerOfferRoutes(app, offers, guards);
  registerAmbassadorRoutes(app, ambassadors);
  registerAdminOfferRoutes(app, { offers, ambassadors }, guards);
}
