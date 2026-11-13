import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import type { Receipt, TrackPoint, TrackView } from "@weems/contrats";
import type { Caller } from "../../plugins/auth.ts";
import { conflict, notFound } from "../../plugins/problem.ts";
import type { FlightsService } from "../flights/service.ts";
import { phaseChangeIndices, phasesAt, phaseStarts } from "./phase-timeline.ts";
import type { TrackEndpoints, TrackStore } from "./repository.ts";

export type { TrackEndpoints };
import { simplifyTrack } from "./simplify.ts";

/** About 500 points draw a 2-hour flight well and keep its page under 2 s (spec J2). */
const MAX_DRAWN_POINTS = 500;

const timesOf = (points: readonly TrackPoint[]) => points.map((p) => Date.parse(p.at));

/** Trajectories: received once per flight, read back simplified with the phase of each point. */
export class TracksService {
  private readonly store: TrackStore;
  private readonly flights: FlightsService;
  private completed: (pilotId: string) => Promise<void> = () => Promise.resolve();

  constructor(store: TrackStore, flights: FlightsService) {
    this.store = store;
    this.flights = flights;
  }

  /**
   * Called once per flight, when its trajectory is stored: the flight is complete (founder
   * offer). The listener must not throw: the tracker's request does not depend on it.
   */
  whenCompleted(listener: (pilotId: string) => Promise<void>): void {
    this.completed = listener;
  }

  async upload(caller: Caller, flightId: string, points: TrackPoint[]): Promise<Receipt> {
    const flight = await this.flights.read(caller, flightId); // 404 if not the caller's
    const json = JSON.stringify(points);
    const sha256 = createHash("sha256").update(json).digest("hex");
    const existing = await this.store.find(flightId);
    if (existing) return this.resend(existing, sha256, flightId);
    const starts = phaseStarts(flight.events);
    const simplified = simplifyTrack(
      points,
      MAX_DRAWN_POINTS,
      phaseChangeIndices(starts, timesOf(points)),
    );
    const track = { recordedPoints: points.length, sha256, simplified, points: gzipSync(json) };
    if (await this.store.insert(flightId, track)) {
      await this.completed(caller.pilotId);
      return { result: "created" };
    }
    // Lost a race with an identical upload: compare with the winner.
    const winner = await this.store.find(flightId);
    return this.resend(winner, sha256, flightId);
  }

  async read(caller: Caller, flightId: string): Promise<TrackView> {
    const flight = await this.flights.read(caller, flightId);
    const track = await this.store.find(flightId);
    if (!track) throw notFound(`Flight ${flightId} has no trajectory yet.`);
    const phases = phasesAt(phaseStarts(flight.events), timesOf(track.simplified));
    return {
      recordedPoints: track.recordedPoints,
      points: track.simplified.map((point, i) => ({ ...point, phase: phases[i] ?? null })),
    };
  }

  /** Every recorded point with its phase (flight bands); 404 without trajectory. */
  async recorded(caller: Caller, flightId: string): Promise<TrackView["points"]> {
    const flight = await this.flights.read(caller, flightId);
    const points = await this.store.recorded(flightId);
    if (!points) throw notFound(`Flight ${flightId} has no trajectory yet.`);
    const phases = phasesAt(phaseStarts(flight.events), timesOf(points));
    return points.map((point, i) => ({ ...point, phase: phases[i] ?? null }));
  }

  /*
   * The two readings below serve public profiles (map, day and night hours). No access check:
   * the caller (profiles service) passes only flights it may show.
   */
  async simplifiedOf(flightIds: readonly string[]): Promise<Map<string, TrackPoint[]>> {
    return this.store.simplifiedOf(flightIds);
  }

  async endpoints(flightIds: readonly string[]): Promise<Map<string, TrackEndpoints>> {
    return this.store.endpoints(flightIds);
  }

  private resend(existing: { sha256: string } | null, sha256: string, flightId: string): Receipt {
    if (existing?.sha256 === sha256) return { result: "alreadyReceived" };
    throw conflict(`Flight ${flightId} already has a different trajectory.`);
  }
}
