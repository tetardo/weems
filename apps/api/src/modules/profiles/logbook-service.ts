import type { PilotLogbook, PilotRoutes, PublicFlightList } from "@weems/contrats";
import type { Caller } from "../../plugins/auth.ts";
import type { ListQuery, PublicProfilesService } from "./public-service.ts";
import type { ProfileRecord, ProfilesRepository } from "./repository.ts";
import { blankProfile } from "./service.ts";

/**
 * The pilot's own logbook: their public page as visitors see it (same flights, same statistics),
 * readable by them even while the profile is not public, as a preview.
 */
export class LogbookService {
  private readonly repository: ProfilesRepository;
  private readonly pages: PublicProfilesService;

  constructor(repository: ProfilesRepository, pages: PublicProfilesService) {
    this.repository = repository;
    this.pages = pages;
  }

  async logbook(caller: Caller): Promise<PilotLogbook> {
    const profile = await this.profile(caller);
    const page = await this.pages.pageOf(profile);
    return { ...page, handle: profile.handle, isPublic: profile.isPublic };
  }

  async flightList(caller: Caller, query: ListQuery): Promise<PublicFlightList> {
    return this.pages.flightListOf(await this.profile(caller), query);
  }

  async routes(caller: Caller): Promise<PilotRoutes> {
    return this.pages.routeMapOf(await this.profile(caller));
  }

  private async profile(caller: Caller): Promise<ProfileRecord> {
    return (await this.repository.find(caller.pilotId)) ?? blankProfile(caller.pilotId);
  }
}
