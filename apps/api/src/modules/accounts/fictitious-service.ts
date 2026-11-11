import { hashPassword } from "better-auth/crypto";
import {
  FICTITIOUS_EMAIL_DOMAIN,
  FICTITIOUS_PASSWORD,
  type FictitiousPilotsCreated,
  type FictitiousPilotsRequest,
  type FictitiousPopulation,
  uuidV7,
} from "@weems/contrats";
import type { Caller } from "../../plugins/auth.ts";
import type { FictitiousAccount, FictitiousAccountsRepository } from "./repository-fictitious.ts";

/** What the fictitious population needs from the flights module. */
export interface FictitiousFlights {
  countByPilot(): Promise<Map<string, number>>;
  /** Deletes the pilot's flights and takes them off the live map. */
  deleteAll(caller: Caller): Promise<void>;
}

/** What it needs from the profiles module. */
export interface FictitiousProfiles {
  publicHandles(): Promise<Map<string, string>>;
}

/** "Léa Fontaine" → "lea-fontaine". */
function slug(name: string): string {
  const ascii = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return ascii.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "pilote";
}

/** Unique even for two pilots of the same name: the end of the id is random. */
function emailOf(name: string, id: string): string {
  return `${slug(name)}-${id.slice(-6)}@${FICTITIOUS_EMAIL_DOMAIN}`;
}

const sumOf = (ids: readonly string[], counts: Map<string, number>) =>
  ids.reduce((total, id) => total + (counts.get(id) ?? 0), 0);

/**
 * Fictitious accounts of the simulated activity (spec admin, page Activité simulée), development only:
 * created in bulk, all marked, deleted together with their flights. Never a real account.
 */
export class FictitiousPilotsService {
  private readonly repository: FictitiousAccountsRepository;
  private readonly flights: FictitiousFlights;
  private readonly profiles: FictitiousProfiles;

  constructor(
    repository: FictitiousAccountsRepository,
    flights: FictitiousFlights,
    profiles: FictitiousProfiles,
  ) {
    this.repository = repository;
    this.flights = flights;
    this.profiles = profiles;
  }

  async create(request: FictitiousPilotsRequest): Promise<FictitiousPilotsCreated> {
    const pilots: FictitiousAccount[] = request.pilots.map(({ name, createdAt }) => {
      const id = uuidV7();
      return { id, name, email: emailOf(name, id), createdAt: new Date(createdAt) };
    });
    await this.repository.insert(pilots, await hashPassword(FICTITIOUS_PASSWORD));
    return {
      pilots: pilots.map(({ id, name, email }) => ({ pilotId: id, name, email })),
    };
  }

  async population(): Promise<FictitiousPopulation> {
    const ids = await this.repository.ids();
    const [flights, handles] = await Promise.all([
      this.flights.countByPilot(),
      this.profiles.publicHandles(),
    ]);
    return {
      accounts: ids.length,
      publicProfiles: ids.filter((id) => handles.has(id)).length,
      flights: sumOf(ids, flights),
    };
  }

  /** Flights first (they do not cascade), then the accounts. Returns what was deleted. */
  async deleteAll(): Promise<FictitiousPopulation> {
    const before = await this.population();
    const ids = await this.repository.ids();
    for (const pilotId of ids) await this.flights.deleteAll({ pilotId });
    await this.repository.deleteAll();
    return before;
  }
}
