import type {
  LivePilot,
  PilotPage,
  PilotRoutes,
  PublicFlightList,
  PublicFlightView,
  PublicPilot,
  PublicPilotIndex,
  TrackView,
} from "@weems/contrats";
import { landingSummary } from "@weems/contrats";
import { ApiProblem, notFound } from "../../plugins/problem.ts";
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

/** A page of a flight list: cursor of the previous page's end, flights per page. */
export interface ListQuery {
  cursor?: string | undefined;
  limit: number;
}

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
    return { handle, ...(await this.pageOf(await this.publicProfile(handle))) };
  }

  async flightList(handle: string, query: ListQuery): Promise<PublicFlightList> {
    return this.flightListOf(await this.publicProfile(handle), query);
  }

  /**
   * The page of a profile, public or not: the caller decides who may read it (public routes by
   * handle, or the pilot's own logbook).
   */
  async pageOf(profile: ProfileRecord): Promise<PilotPage> {
    const identity = await this.accounts.pilot(profile.pilotId);
    if (!identity) throw noProfile();
    const flights = await this.flights.allPublic(profile.pilotId, await this.hidden(profile));
    const tracks = await this.tracks.simplifiedOf(flights.map((f) => f.summary.flightId));
    const now = new Date();
    return {
      name: identity.name,
      country: profile.country,
      homeIcao: profile.homeIcao,
      level: profile.level,
      vatsimId: profile.vatsimId,
      ivaoId: profile.ivaoId,
      instagram: profile.instagram,
      facebook: profile.facebook,
      memberSince: identity.createdAt.toISOString(),
      hasPhoto: await this.repository.hasPhoto(profile.pilotId),
      fictitious: identity.fictitious,
      stats: pilotStats(flights, tracks, now),
      charts: pilotCharts(flights, tracks, now),
    };
  }

  /**
   * Pilots of the live map whose public profile is on, by pilot id; the others are left out and
   * stay anonymous on the map (spec J4, carte en direct).
   */
  async livePilots(pilotIds: string[]): Promise<Map<string, LivePilot>> {
    const profiles = await this.repository.publicOf(pilotIds);
    const names = await this.accounts.namesOf(profiles.map((profile) => profile.pilotId));
    return new Map(
      profiles.flatMap(({ pilotId, ...profile }) => {
        const name = names.get(pilotId);
        return name === undefined ? [] : [[pilotId, { ...profile, name }] as const];
      }),
    );
  }

  async flightListOf(profile: ProfileRecord, query: ListQuery): Promise<PublicFlightList> {
    const page = await this.flights.listPublic(profile.pilotId, await this.hidden(profile), query);
    return { flights: page.flights.map(publicLine), nextCursor: page.nextCursor };
  }

  async routeMapOf(profile: ProfileRecord): Promise<PilotRoutes> {
    const flights = await this.flights.allPublic(profile.pilotId, await this.hidden(profile));
    const summaries = flights.map((f) => f.summary);
    const endpoints = await this.tracks.endpoints(summaries.map((f) => f.flightId));
    return { routes: routesOf(summaries, endpoints) };
  }

  async flight(handle: string, flightId: string): Promise<PublicFlightView> {
    return (await this.publicFlight(handle, flightId)).flight;
  }

  async track(handle: string, flightId: string): Promise<TrackView> {
    const { owner } = await this.publicFlight(handle, flightId);
    return this.tracks.read(owner, flightId);
  }

  async routes(handle: string): Promise<PilotRoutes> {
    return this.routeMapOf(await this.publicProfile(handle));
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
    const flight = await this.flights.read(owner, flightId).catch((error: unknown) => {
      throw error instanceof ApiProblem && error.status === 404 ? noFlight() : error;
    });
    if (flight.closedAt === null || (await this.repository.isHidden(flightId))) throw noFlight();
    return { owner, flight };
  }
}
