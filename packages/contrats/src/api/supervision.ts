import { z } from "zod";
import { UtcTimestamp } from "./common.ts";

/**
 * GET /v1/admin/supervision: the page Supervision of the admin console (spec admin).
 * "Real" leaves out the fictitious accounts and the simulated flights (simulator "replay" or
 * flown by a fictitious account); those are counted apart.
 */
const Count = z.number().int().nonnegative();

/** One value per day, oldest first, the last one is today (Europe/Paris). */
const Daily = z.array(Count);

/** A pilot as the console lists them: public pseudonym and public profile address, if any. */
const PilotRef = z.object({
  id: z.uuid(),
  name: z.string(),
  publicHandle: z.string().nullable(),
});

export const SupervisionTiles = z.object({
  /** Active real accounts; `daily`: how many existed at the end of each of the last 7 days. */
  accounts: z.object({
    real: Count,
    newLast7Days: Count,
    fictitious: Count,
    pendingInvitations: Count,
    daily: Daily,
  }),
  /** Real flights; `daily`: real flights opened each of the last 7 days. */
  flights: z.object({
    real: Count,
    newLast7Days: Count,
    today: Count,
    simulated: Count,
    daily: Daily,
  }),
  /** On the live map now. */
  live: z.object({ flights: Count, simulated: Count }),
  /** Public profiles of real accounts; `daily`: public at the end of each of the last 7 days. */
  profiles: z.object({
    public: Count,
    realAccounts: Count,
    newLast7Days: Count,
    daily: Daily,
  }),
  /** Real flights open for more than 24 h, or closed without trajectory (rule of the alpha report). */
  suspicious: z.object({ stale: Count, withoutTrack: Count }),
});
export type SupervisionTiles = z.infer<typeof SupervisionTiles>;

export const SupervisionHealth = z.object({
  /** One entry per hour of the last 24, oldest first; p95 null when no request. */
  apiHours: z.array(z.object({ p95Ms: z.number().nullable(), serverErrors: Count })),
  /** Positions received each minute of the last 30, oldest first. */
  positionsPerMinute: z.array(Count),
  lastPositionAt: UtcTimestamp.nullable(),
  /** API restart: both series above start empty from it (they live in memory). */
  measuredSince: UtcTimestamp,
  /** Real flights of the last 30 days, per tracker version, most used first. */
  trackerVersions: z.array(z.object({ version: z.string(), flights: Count })),
  database: z.object({
    bytes: Count,
    largestTables: z.array(z.object({ name: z.string(), bytes: Count })),
  }),
  migrations: z.object({ applied: Count, expected: Count }),
});
export type SupervisionHealth = z.infer<typeof SupervisionHealth>;

export const SupervisionEventKind = z.enum([
  "accountCreated",
  "accountDisabled",
  "invitationCreated",
  "profilePublished",
  "flightOpened",
  "flightClosed",
]);
export type SupervisionEventKind = z.infer<typeof SupervisionEventKind>;

/** A dated fact of the real activity, for the list « Derniers événements ». */
export const SupervisionEvent = z.object({
  at: UtcTimestamp,
  kind: SupervisionEventKind,
  /** Account concerned (null for an invitation: its e-mail is never shown). */
  pilot: z.string().nullable(),
  /** Flight concerned: callsign, departure and arrival when known. */
  flight: z
    .object({ callsign: z.string(), from: z.string().nullable(), to: z.string().nullable() })
    .nullable(),
});
export type SupervisionEvent = z.infer<typeof SupervisionEvent>;

export const SupervisionActivity = z.object({
  /** Last 14 days, oldest first. */
  days: z.array(z.object({ date: z.iso.date(), real: Count, simulated: Count })),
  /** J3 exit criterion on the real flights (5 pilots, 50 closed flights, 95 % phases right). */
  alpha: z.object({
    pilots: Count,
    closedFlights: Count,
    correctShare: z.number().min(0).max(1).nullable(),
    targets: z.object({ pilots: Count, flights: Count, correctShare: z.number() }),
  }),
  events: z.array(SupervisionEvent),
});
export type SupervisionActivity = z.infer<typeof SupervisionActivity>;

/** Real accounts only: the fictitious ones would take every place. */
export const SupervisionCommunity = z.object({
  newest: z.array(PilotRef.extend({ createdAt: UtcTimestamp })),
  /** Most flights of the last 30 days, then most hours. */
  mostActive: z.array(PilotRef.extend({ flights: Count, hours: z.number().nonnegative() })),
  /** Most hours of all time (until the medals exist). */
  mostHours: z.array(PilotRef.extend({ flights: Count, hours: z.number().nonnegative() })),
});
export type SupervisionCommunity = z.infer<typeof SupervisionCommunity>;

export const AdminSupervision = z.object({
  generatedAt: UtcTimestamp,
  tiles: SupervisionTiles,
  health: SupervisionHealth,
  activity: SupervisionActivity,
  community: SupervisionCommunity,
});
export type AdminSupervision = z.infer<typeof AdminSupervision>;
