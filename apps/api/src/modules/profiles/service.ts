import {
  PilotHandle,
  type FlightVisibility,
  type HandleCheck,
  type HiddenFlights,
  type MyProfile,
  type ProfileUpdate,
} from "@weems/contrats";
import type { Caller } from "../../plugins/auth.ts";
import { conflict, notFound, unprocessable } from "../../plugins/problem.ts";
import type { AccountsService } from "../accounts/service.ts";
import type { FlightsService } from "../flights/service.ts";
import { handleSuffix, isReservedHandle, suggestHandle } from "./handle.ts";
import { normalizePhoto } from "./photo.ts";
import type { ProfileRecord, ProfilesRepository } from "./repository.ts";

const EMPTY_FIELDS = {
  handle: null,
  isPublic: false,
  country: null,
  homeIcao: null,
  level: null,
  vatsimId: null,
  ivaoId: null,
  instagram: null,
  facebook: null,
  simbriefId: null,
  publishedAt: null,
  unpublishedAt: null,
};

/** Consent trace: when the profile was last made public, and last taken down. */
function consentDates(before: ProfileRecord | null, isPublic: boolean, now: Date) {
  const previous = before ?? { isPublic: false, publishedAt: null, unpublishedAt: null };
  if (isPublic === previous.isPublic) {
    return { publishedAt: previous.publishedAt, unpublishedAt: previous.unpublishedAt };
  }
  return isPublic
    ? { publishedAt: now, unpublishedAt: previous.unpublishedAt }
    : { publishedAt: previous.publishedAt, unpublishedAt: now };
}

/**
 * The pilot's own profile settings (spec J4 profil public): off by default, a handle to publish,
 * a photo, and flights kept off the profile.
 */
export class ProfilesService {
  private readonly repository: ProfilesRepository;
  private readonly flights: FlightsService;
  private readonly accounts: AccountsService;

  constructor(repository: ProfilesRepository, flights: FlightsService, accounts: AccountsService) {
    this.repository = repository;
    this.flights = flights;
    this.accounts = accounts;
  }

  async read(caller: Caller): Promise<MyProfile> {
    const profile = await this.repository.find(caller.pilotId);
    return this.view(caller.pilotId, profile);
  }

  async update(caller: Caller, update: ProfileUpdate): Promise<MyProfile> {
    if (update.isPublic && update.handle === null) {
      throw unprocessable("Choose the address of the profile (handle) before publishing it.");
    }
    if (update.handle !== null && isReservedHandle(update.handle)) {
      throw unprocessable(`The handle "${update.handle}" is reserved.`);
    }
    const before = await this.repository.find(caller.pilotId);
    const now = new Date();
    const profile: ProfileRecord = {
      ...update,
      pilotId: caller.pilotId,
      ...consentDates(before, update.isPublic, now),
      updatedAt: now,
    };
    if (!(await this.repository.save(profile))) {
      throw conflict(`The handle "${update.handle}" is already taken.`);
    }
    return this.view(caller.pilotId, profile);
  }

  async savePhoto(caller: Caller, upload: Buffer): Promise<void> {
    await this.repository.savePhoto(caller.pilotId, await normalizePhoto(upload));
  }

  async deletePhoto(caller: Caller): Promise<void> {
    await this.repository.deletePhoto(caller.pilotId);
  }

  /** The pilot always sees their own photo, public profile or not. */
  async photo(caller: Caller): Promise<Buffer> {
    const photo = await this.repository.findPhoto(caller.pilotId);
    if (!photo) throw notFound("No profile photo.");
    return photo;
  }

  async visibility(caller: Caller, flightId: string): Promise<FlightVisibility> {
    await this.flights.read(caller, flightId); // 404 if not the caller's
    return { hiddenOnProfile: await this.repository.isHidden(flightId) };
  }

  async setVisibility(
    caller: Caller,
    flightId: string,
    visibility: FlightVisibility,
  ): Promise<FlightVisibility> {
    await this.flights.read(caller, flightId);
    await this.repository.setHidden(caller.pilotId, flightId, visibility.hiddenOnProfile);
    return visibility;
  }

  /** The caller's flights hidden from the profile, newest first. */
  async hiddenFlights(caller: Caller): Promise<HiddenFlights> {
    const ids = await this.repository.hiddenFlightsOf(caller.pilotId);
    const summaries = await this.flights.summariesOf(caller, ids);
    return {
      flights: summaries.map(
        ({ flightId, callsign, departureIcao, plannedArrivalIcao, openedAt }) => ({
          flightId,
          callsign,
          departureIcao,
          plannedArrivalIcao,
          openedAt,
        }),
      ),
    };
  }

  /** Whether the caller can take this address, checked as they type it. */
  async checkHandle(caller: Caller, handle: string): Promise<HandleCheck> {
    const status = !PilotHandle.safeParse(handle).success
      ? "invalid"
      : isReservedHandle(handle)
        ? "reserved"
        : (await this.repository.isHandleTaken(handle, caller.pilotId))
          ? "taken"
          : "available";
    return { handle, status };
  }

  private async view(pilotId: string, stored: ProfileRecord | null): Promise<MyProfile> {
    const profile = stored ?? { ...EMPTY_FIELDS, pilotId };
    const { pilotId: _pilot, unpublishedAt: _down, publishedAt, ...fields } = profile;
    return {
      ...fields,
      publishedAt: publishedAt?.toISOString() ?? null,
      suggestedHandle: profile.handle ?? (await this.suggestion(pilotId)),
      hasPhoto: await this.repository.hasPhoto(pilotId),
    };
  }

  private async suggestion(pilotId: string): Promise<string> {
    const name = (await this.accounts.pilot(pilotId))?.name ?? "";
    const handle = suggestHandle(name, pilotId);
    if (!(await this.repository.isHandleTaken(handle, pilotId))) return handle;
    return `${handle.slice(0, 25)}-${handleSuffix(pilotId)}`;
  }
}
