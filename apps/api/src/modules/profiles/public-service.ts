import type {
  PilotRoutes,
  PublicFlightList,
  PublicFlightView,
  PublicPilot,
  PublicPilotIndex,
  TrackView,
} from "@weems/contrats";
import { landingSummary } from "@weems/contrats";
import { notFound } from "../../plugins/problem.ts";
import type { AccountsService } from "../accounts/service.ts";
import type { FlightsService, SummaryWithEvents } from "../flights/service.ts";
import type { TracksService } from "../tracks/service.ts";
import type { ProfileRecord, ProfilesRepository } from "./repository.ts";
import { pilotCharts } from "./charts.ts";
import { routesOf } from "./route-map.ts";
import { pilotStats } from "./stats.ts";

/** Same answer for an unknown, private or deleted profile: nobody learns that a handle exists. */
const noProfile = () => notFound("No public profile at this address.");
const noFlight = () => notFound("No public flight at this address.");

function publicLine({ summary, events }: SummaryWithEvents): PublicFlightList["flights"][number] {
  const { closeReason: _reason, ...line } = summary;
  return { ...line, touchdownVs: landingSummary(events)?.touchdownVs ?? null };
}

/** Pages anyone can read, without account (spec J4 profil public). Never the pilot's private data. */
export class PublicProfilesService {
  private readonly repository: ProfilesRepository;
  private readonly flights: FlightsService;
  private readonly tracks: TracksService;
  private readonly accounts: AccountsService;

  constructor(
    repository: ProfilesRepository,
    flights: FlightsService,
    tracks: TracksService,
    accounts: AccountsService,
  ) {
    this.repository = repository;
    this.flights = flights;
    this.tracks = tracks;
    this.accounts = accounts;
  }

  async pilot(handle: string): Promise<PublicPilot> {
    const profile = await this.publicProfile(handle);
    const identity = await this.accounts.pilot(profile.pilotId);
    if (!identity) throw noProfile();
    const flights = await this.flights.allPublic(profile.pilotId, await this.hidden(profile));
    const tracks = await this.tracks.simplifiedOf(flights.map((f) => f.summary.flightId));
    const now = new Date();
    return {
      handle,
      name: identity.name,
      country: profile.country,
      homeIcao: profile.homeIcao,
      level: profile.level,
      vatsimId: profile.vatsimId,
      ivaoId: profile.ivaoId,
      memberSince: identity.createdAt.toISOString(),
      hasPhoto: await this.repository.hasPhoto(profile.pilotId),
      stats: pilotStats(flights, tracks, now),
      charts: pilotCharts(flights, tracks, now),
    };
  }

  async flightList(
    handle: string,
    query: { cursor?: string | undefined; limit: number },
  ): Promise<PublicFlightList> {
    const profile = await this.publicProfile(handle);
    const page = await this.flights.listPublic(profile.pilotId, await this.hidden(profile), query);
    return { flights: page.flights.map(publicLine), nextCursor: page.nextCursor };
  }

  async flight(handle: string, flightId: string): Promise<PublicFlightView> {
    return (await this.publicFlight(handle, flightId)).flight;
  }

  async track(handle: string, flightId: string): Promise<TrackView> {
    const { owner } = await this.publicFlight(handle, flightId);
    return this.tracks.read(owner, flightId);
  }

  async routes(handle: string): Promise<PilotRoutes> {
    const profile = await this.publicProfile(handle);
    const flights = await this.flights.allPublic(profile.pilotId, await this.hidden(profile));
    const summaries = flights.map((f) => f.summary);
    const endpoints = await this.tracks.endpoints(summaries.map((f) => f.flightId));
    return { routes: routesOf(summaries, endpoints) };
  }

  async photo(handle: string): Promise<Buffer> {
    const profile = await this.publicProfile(handle);
    const photo = await this.repository.findPhoto(profile.pilotId);
    if (!photo) throw notFound("This pilot has no photo.");
    return photo;
  }

  async index(): Promise<PublicPilotIndex> {
    const pilots = await this.repository.listPublic();
    return {
      pilots: pilots.map((p) => ({ handle: p.handle, updatedAt: p.updatedAt.toISOString() })),
    };
  }

  private async publicProfile(handle: string): Promise<ProfileRecord> {
    const profile = await this.repository.findPublic(handle);
    if (!profile) throw noProfile();
    return profile;
  }

  private hidden(profile: ProfileRecord): Promise<string[]> {
    return this.repository.hiddenFlightsOf(profile.pilotId);
  }

  /**
   * A flight shown on a public profile, and its owner as a caller of the flights service: the
   * flight must be theirs, closed, and not hidden. Anything else is "not found".
   */
  private async publicFlight(handle: string, flightId: string) {
    const profile = await this.publicProfile(handle);
    const owner = { pilotId: profile.pilotId };
    const flight = await this.flights.read(owner, flightId).catch(() => {
      throw noFlight();
    });
    if (flight.closedAt === null || (await this.repository.isHidden(flightId))) throw noFlight();
    return { owner, flight };
  }
}
