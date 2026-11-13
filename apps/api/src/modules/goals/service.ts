import type { GoalDefinition, Goals, GoalView } from "@weems/contrats";
import type { Caller } from "../../plugins/auth.ts";
import { forbidden, notFound } from "../../plugins/problem.ts";
import type { FlightsService } from "../flights/service.ts";
import type { PlansService } from "../plans/service.ts";
import type { TracksService } from "../tracks/service.ts";
import { flightFacts } from "./facts.ts";
import { type GoalRecord, goalView } from "./goal-view.ts";
import type { GoalsRepository } from "./repository.ts";
import { goalSuggestions } from "./suggestions.ts";

const FINISHED_SHOWN = 10;

/**
 * Objectifs of the private logbook (spec carnet privé, § 6). Progress is computed from the
 * pilot's closed flights at each reading; the plan sets how many run at once (key goals), the
 * suggestions (goalSuggestions) and the « Bonnes pratiques » kind (goalGoodPractices).
 */
export class GoalsService {
  private readonly repository: GoalsRepository;
  private readonly flights: FlightsService;
  private readonly tracks: TracksService;
  private readonly plans: PlansService;

  constructor(
    repository: GoalsRepository,
    flights: FlightsService,
    tracks: TracksService,
    plans: PlansService,
  ) {
    this.repository = repository;
    this.flights = flights;
    this.tracks = tracks;
    this.plans = plans;
  }

  async list(caller: Caller, now = new Date()): Promise<Goals> {
    const id = caller.pilotId;
    const [records, limit, suggest, goodPracticesAllowed] = await Promise.all([
      this.repository.allOf(id),
      this.plans.valueOf(id, "goals"),
      this.plans.includes(id, "goalSuggestions"),
      this.plans.includes(id, "goalGoodPractices"),
    ]);
    const facts = await this.factsFor(id, records);
    const views = records.map((record) => goalView(record, facts, now));
    const active = views.filter((view) => view.status === "active");
    const finished = views
      .filter((view) => view.status !== "active")
      .sort((a, b) => (b.finishedAt ?? "").localeCompare(a.finishedAt ?? ""))
      .slice(0, FINISHED_SHOWN);
    const pursued = new Set(active.map((view) => view.definition.kind));
    return {
      active,
      finished,
      suggestions: suggest ? goalSuggestions(facts, pursued, now) : null,
      maxActive: typeof limit === "number" ? limit : null,
      goodPracticesAllowed,
    };
  }

  /** A free pilot keeps one goal running: the new one sets the current one aside. */
  async create(caller: Caller, definition: GoalDefinition, now = new Date()): Promise<GoalView> {
    const id = caller.pilotId;
    await this.checkKind(id, definition);
    const limit = await this.plans.valueOf(id, "goals");
    const { active } = await this.list(caller, now);
    if (typeof limit === "number" && active.length >= limit) {
      const oldest = active.slice(limit - 1).map((view) => view.goalId);
      await this.repository.archive(id, oldest, now);
    }
    const goalId = await this.repository.create(id, definition, now);
    return this.read(caller, goalId, now);
  }

  async update(caller: Caller, goalId: string, definition: GoalDefinition): Promise<GoalView> {
    await this.checkKind(caller.pilotId, definition);
    const now = new Date();
    if (!(await this.repository.update(caller.pilotId, goalId, definition, now)))
      throw notFound(`Goal ${goalId} not found.`);
    return this.read(caller, goalId, now);
  }

  async archive(caller: Caller, goalId: string): Promise<GoalView> {
    const now = new Date();
    await this.read(caller, goalId, now); // 404 unless the caller's
    await this.repository.archive(caller.pilotId, [goalId], now);
    return this.read(caller, goalId, now);
  }

  private async read(caller: Caller, goalId: string, now: Date): Promise<GoalView> {
    const records = await this.repository.allOf(caller.pilotId);
    const record = records.find((r) => r.goalId === goalId);
    if (!record) throw notFound(`Goal ${goalId} not found.`);
    return goalView(record, await this.factsFor(caller.pilotId, [record]), now);
  }

  private async checkKind(pilotId: string, definition: GoalDefinition): Promise<void> {
    if (definition.kind !== "goodPractices") return;
    if (!(await this.plans.includes(pilotId, "goalGoodPractices")))
      throw forbidden("The « Bonnes pratiques » goals come with Pilot Pro.");
  }

  /** Closed flights, with their trajectories only when a goal counts good practices. */
  private async factsFor(pilotId: string, records: readonly GoalRecord[]) {
    const closed = await this.flights.allClosed(pilotId);
    const practices = records.some((r) => r.definition.kind === "goodPractices");
    const ids = practices ? closed.map(({ summary }) => summary.flightId) : [];
    const tracks = ids.length > 0 ? await this.tracks.simplifiedOf(ids) : new Map();
    return flightFacts(closed, tracks);
  }
}
