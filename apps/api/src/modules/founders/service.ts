import {
  type AdminFounders,
  FOUNDER_OFFER,
  type FounderFlight,
  type LivePilot,
  type MyFounder,
  type PublicFounders,
} from "@weems/contrats";
import { conflict, notFound } from "../../plugins/problem.ts";
import type { AccountsService } from "../accounts/service.ts";
import type { FlightsService } from "../flights/service.ts";
import type { PlansService } from "../plans/service.ts";
import { lengthNm } from "../profiles/stats.ts";
import type { TracksService } from "../tracks/service.ts";
import { founderFlight, progressOf } from "./flight-check.ts";
import type { FounderRecord, FoundersRepository } from "./repository.ts";
import { confirmsAt, placeOf, statusOf } from "./status.ts";

/** Referral codes of a founder (implemented by the offers module). */
interface ReferralCodes {
  issue(pilotId: string): Promise<void>;
  /** The codes not used yet stop working (refused founder). */
  withdraw(pilotId: string): Promise<void>;
}

/** Public identity of the pilots whose profile is public (implemented by the profiles module). */
type PublicPilots = (pilotIds: string[]) => Promise<ReadonlyMap<string, LivePilot>>;

export interface FoundersDependencies {
  repository: FoundersRepository;
  flights: FlightsService;
  tracks: TracksService;
  accounts: AccountsService;
  plans: PlansService;
  referral: ReferralCodes;
  publicPilots: PublicPilots;
  now?: () => Date;
}

const SHOWN_FLIGHTS = 10;
const LATEST_FOUNDERS = 5;

/**
 * Offer « Pilote fondateur » (spec offre fondateurs). A pilot becomes a founder when their 3rd
 * valid flight, on a 2nd day at least, is known: they get the next number, Pilot Pro for a year
 * and 3 referral codes. The console can refuse a place within 48 h; a refusal takes Pilot Pro and
 * the unused codes back and frees the place, never the number.
 */
export class FoundersService {
  private readonly deps: FoundersDependencies;
  private readonly now: () => Date;

  constructor(deps: FoundersDependencies) {
    this.deps = deps;
    this.now = deps.now ?? (() => new Date());
  }

  /** The caller's progress; gives them their place if they just qualified. */
  async mine(pilotId: string): Promise<MyFounder> {
    const eligible = await this.eligible(pilotId);
    const flights = await this.flightsOf(pilotId);
    const progress = progressOf(flights);
    const record = eligible ? await this.placeFor(pilotId, progress.qualified) : null;
    const taken = await this.deps.repository.taken();
    return {
      place: record && placeOf(record, this.now()),
      eligible,
      placesLeft: Math.max(0, FOUNDER_OFFER.places - taken),
      validFlights: progress.validFlights,
      validDays: progress.validDays,
      flights: flights.slice(0, SHOWN_FLIGHTS),
    };
  }

  /**
   * A trajectory was received (the last part of a flight): the pilot may have just qualified.
   * Called by the tracks module; never fails the tracker's request.
   */
  async flightCompleted(pilotId: string): Promise<void> {
    if (!(await this.eligible(pilotId))) return;
    if (await this.deps.repository.findByPilot(pilotId)) return;
    const { qualified } = progressOf(await this.flightsOf(pilotId));
    if (qualified) await this.placeFor(pilotId, true);
  }

  async public(): Promise<PublicFounders> {
    const now = this.now();
    const reviewedBefore = new Date(now.getTime() - FOUNDER_OFFER.reviewHours * 3_600_000);
    const latest = await this.deps.repository.latestConfirmed(reviewedBefore, LATEST_FOUNDERS);
    const pilots = await this.deps.publicPilots(latest.map((record) => record.pilotId));
    const taken = await this.deps.repository.taken();
    return {
      places: FOUNDER_OFFER.places,
      taken,
      placesLeft: Math.max(0, FOUNDER_OFFER.places - taken),
      latest: latest.map((record) => ({
        number: record.number,
        confirmedAt: (record.confirmedAt ?? confirmsAt(record)).toISOString(),
        pilot: pilots.get(record.pilotId) ?? null,
      })),
    };
  }

  /** Confirmed numbers of these pilots (badges of the profile pages and of the live map). */
  async confirmedNumbers(pilotIds: readonly string[]): Promise<Map<string, number>> {
    const records = await this.deps.repository.ofPilots(pilotIds);
    const now = this.now();
    return new Map(
      records
        .filter((record) => statusOf(record, now) === "confirmed")
        .map((record) => [record.pilotId, record.number]),
    );
  }

  async adminList(): Promise<AdminFounders> {
    const now = this.now();
    const records = await this.deps.repository.list();
    const founders = records.map((record) => ({
      ...placeOf(record, now),
      pilotId: record.pilotId,
      name: record.name,
      refusedAt: record.refusedAt?.toISOString() ?? null,
    }));
    const countOf = (status: string) => founders.filter((f) => f.status === status).length;
    return {
      places: FOUNDER_OFFER.places,
      confirmed: countOf("confirmed"),
      pending: countOf("pending"),
      refused: countOf("refused"),
      founders,
    };
  }

  /** Confirms a place before the end of the delay; nothing changes for one already confirmed. */
  async confirm(number: number): Promise<void> {
    const record = await this.found(number);
    if (record.refusedAt) throw conflict(`Founder place ${number} was refused.`);
    if (!record.confirmedAt) await this.deps.repository.confirm(number, this.now());
  }

  /** Refuses a place (abuse): Pilot Pro and unused codes taken back, number never given again. */
  async refuse(number: number): Promise<void> {
    const record = await this.found(number);
    if (record.refusedAt) return;
    await this.deps.repository.refuse(number, this.now());
    await this.deps.plans.takeBack(record.pilotId, "founder");
    await this.deps.referral.withdraw(record.pilotId);
  }

  private async found(number: number): Promise<FounderRecord> {
    const record = await this.deps.repository.findByNumber(number);
    if (!record) throw notFound(`No founder place ${number}.`);
    return record;
  }

  /** Administrators and fictitious accounts never take a place. */
  private async eligible(pilotId: string): Promise<boolean> {
    const status = await this.deps.accounts.statusOf(pilotId);
    return status !== null && status.role === "pilot" && !status.fictitious && !status.disabledAt;
  }

  /** The pilot's place; a new one (with its gifts) when they qualified and places are left. */
  private async placeFor(pilotId: string, qualified: boolean): Promise<FounderRecord | null> {
    const existing = await this.deps.repository.findByPilot(pilotId);
    if (existing || !qualified) return existing;
    const number = await this.deps.repository.claim(pilotId, FOUNDER_OFFER.places, this.now());
    if (number === null) return this.deps.repository.findByPilot(pilotId);
    await this.deps.plans.givePro(pilotId, FOUNDER_OFFER.months, "founder");
    await this.deps.referral.issue(pilotId);
    return this.deps.repository.findByPilot(pilotId);
  }

  /** The pilot's closed flights, newest first, each checked. */
  private async flightsOf(pilotId: string): Promise<FounderFlight[]> {
    const closed = await this.deps.flights.allClosed(pilotId);
    const tracks = await this.deps.tracks.simplifiedOf(closed.map((f) => f.summary.flightId));
    return closed.map((flight) => {
      const points = tracks.get(flight.summary.flightId);
      return founderFlight(flight, points && points.length > 1 ? lengthNm(points) : null);
    });
  }
}
