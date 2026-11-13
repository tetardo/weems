import type { TrackPoint } from "@weems/contrats";

/** Simplified trajectories of the flights, by flight id (flights without one are absent). */
export type Tracks = ReadonlyMap<string, readonly TrackPoint[]>;
