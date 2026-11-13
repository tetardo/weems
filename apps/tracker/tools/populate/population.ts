import { PilotRank, type PopulationProgress, type PopulationResult } from "@weems/contrats";
import type { DevApi } from "./dev-api.ts";
import { identities } from "./identities.ts";
import { flyInWorkers } from "./fly-workers.ts";
import type { PastFlight } from "./past-flight.ts";
import { pool } from "./pool.ts";
import { careerScheduleOf, type PilotSchedule, scheduleOf } from "./schedule.ts";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface PopulationOptions {
  api: DevApi;
  apiUrl: string;
  accounts: number;
  minFlights: number;
  maxFlights: number;
  /** Length of the history, days before now. */
  days: number;
  /** Share of public profiles, 0 to 1. */
  publicShare: number;
  /** One public account per pilot rank, with the history that reaches it (spec grades). */
  careers: boolean;
  random: () => number;
  workDir: string;
  trackerVersion: string;
  /** Flights flown at the same time, over all the worker threads (one per core). */
  concurrency?: number;
  signal?: AbortSignal;
  onProgress?: (progress: PopulationProgress) => void;
  now?: () => number;
}

interface Planned extends PastFlight {
  pilotId: string;
}

/**
 * Creates the fictitious population (page Activité simulée): deletes the previous one,
 * creates the accounts and their profiles, then flies their past flights through the real
 * tracker. Returns what the API holds at the end.
 */
export async function createPopulation(options: PopulationOptions): Promise<PopulationResult> {
  const now = options.now ?? Date.now;
  const startedMs = now();
  const schedules = schedulesOf(options, startedMs);
  const total = schedules.reduce((sum, s) => sum + s.flights.length, 0);
  const progress = new ProgressMeter(options, schedules.length, total, now);

  progress.step("cleaning");
  await options.api.deleteAll();
  progress.step("accounts");
  const planned = await createAccounts(schedules, options, progress);
  progress.step("flights");
  await flyAll(planned, options, progress);
  progress.step("check");
  return check(schedules, total, options, (now() - startedMs) / 1000);
}

/**
 * The schedule of every account: with `careers`, the first ones (public) each reach one pilot
 * rank, from Élève to Légende; the others fly their 5 to 40 flights as hobby pilots.
 */
function schedulesOf(options: PopulationOptions, nowMs: number): PilotSchedule[] {
  const window = {
    minFlights: options.minFlights,
    maxFlights: options.maxFlights,
    fromMs: nowMs - options.days * DAY_MS,
    nowMs,
  };
  const ranks = options.careers ? PilotRank.options : [];
  return identities(options.accounts, options.publicShare, options.random).map(
    (identity, index) => {
      const rank = ranks[index];
      if (!rank) return scheduleOf(identity, window, options.random);
      return careerScheduleOf({ ...identity, isPublic: true }, rank, window, options.random);
    },
  );
}

async function createAccounts(
  schedules: readonly PilotSchedule[],
  options: PopulationOptions,
  progress: ProgressMeter,
): Promise<Planned[]> {
  const created = await options.api.createPilots(
    schedules.map((s) => ({ name: s.identity.name, createdAtMs: s.createdAtMs })),
  );
  const planned: Planned[] = [];
  await pool(
    schedules.map((schedule, index) => ({ schedule, pilotId: created[index]?.pilotId ?? "" })),
    8,
    async ({ schedule, pilotId }) => {
      await options.api.saveProfile(pilotId, schedule.identity);
      planned.push(...schedule.flights.map((flight) => ({ ...flight, pilotId })));
      progress.accountDone();
    },
    options.signal,
  );
  return planned.sort((a, b) => a.openedAtMs - b.openedAtMs);
}

async function flyAll(
  planned: readonly Planned[],
  options: PopulationOptions,
  progress: ProgressMeter,
) {
  const flights = planned.map(({ pilotId, ...flight }) => ({
    flight,
    token: options.api.tokenOf(pilotId),
  }));
  await flyInWorkers(flights, {
    apiUrl: options.apiUrl,
    workDir: options.workDir,
    trackerVersion: options.trackerVersion,
    concurrency: options.concurrency ?? 16,
    ...(options.signal ? { signal: options.signal } : {}),
    onFlightDone: () => progress.flightDone(),
  });
}

/** What the API holds now, and whether every public profile has its counters and charts. */
async function check(
  schedules: readonly PilotSchedule[],
  planned: number,
  options: PopulationOptions,
  durationS: number,
): Promise<PopulationResult> {
  const population = await options.api.population();
  const handles = schedules.filter((s) => s.identity.isPublic).map((s) => s.identity.handle);
  let filled = 0;
  for (const handle of handles) {
    const response = await fetch(new URL(`/v1/pilots/${handle}`, options.apiUrl));
    const body = response.ok ? ((await response.json()) as { stats?: { flights?: number } }) : null;
    if ((body?.stats?.flights ?? 0) > 0) filled++;
  }
  return {
    stopped: options.signal?.aborted ?? false,
    accounts: population.accounts,
    publicProfiles: population.publicProfiles,
    flights: { done: population.flights, total: planned },
    filledProfiles: { done: filled, total: handles.length },
    durationS,
  };
}

/** Counts what is done and reports it (the CLI writes one line per second at most). */
class ProgressMeter {
  private readonly progress: PopulationProgress;
  private readonly options: PopulationOptions;
  private readonly now: () => number;
  private flightsStartedMs: number | null = null;

  constructor(options: PopulationOptions, accounts: number, flights: number, now: () => number) {
    this.options = options;
    this.now = now;
    this.progress = {
      step: "cleaning",
      accounts: { done: 0, total: accounts },
      flights: { done: 0, total: flights },
      flightsPerS: 0,
    };
  }

  step(step: PopulationProgress["step"]): void {
    this.progress.step = step;
    if (step === "flights") this.flightsStartedMs = this.now();
    this.report();
  }

  accountDone(): void {
    this.progress.accounts.done++;
    this.report();
  }

  flightDone(): void {
    this.progress.flights.done++;
    const elapsedS = (this.now() - (this.flightsStartedMs ?? this.now())) / 1000;
    this.progress.flightsPerS = elapsedS > 0 ? this.progress.flights.done / elapsedS : 0;
    this.report();
  }

  private report(): void {
    this.options.onProgress?.(structuredClone(this.progress));
  }
}
