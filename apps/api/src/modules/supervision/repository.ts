import { sql } from "drizzle-orm";
import type { Database } from "../../db/client.ts";
import type { FlightFacts } from "../alpha/alpha-report.ts";
import {
  FLIGHTS_WITH_PILOT,
  REAL_ACCOUNT,
  REAL_FLIGHT,
  num,
  parisDay,
  parisMidnight,
  rowsOf,
} from "./sql-parts.ts";

export interface AccountCounts {
  real: number;
  newLast7Days: number;
  fictitious: number;
  pendingInvitations: number;
}

export interface FlightCounts {
  real: number;
  newLast7Days: number;
  today: number;
  simulated: number;
}

export interface DayCount {
  date: string;
  real: number;
  simulated: number;
}

export interface ProfileCounts {
  public: number;
  newLast7Days: number;
}

/**
 * Read-only counts of the page Supervision (spec admin). Reads several modules' tables at once,
 * like the alpha report: a report, never a write, never another module's rules.
 */
export class SupervisionRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async accountCounts(): Promise<AccountCounts> {
    const [row] = await rowsOf<Record<string, unknown>>(
      this.db,
      sql`select
        count(*) filter (where ${REAL_ACCOUNT}) as real,
        count(*) filter (where ${REAL_ACCOUNT} and u.created_at > now() - interval '7 days') as new7,
        count(*) filter (where u.fictitious) as fictitious,
        (select count(*) from invitations where used_at is null and expires_at > now()) as pending
      from users u`,
    );
    return {
      real: num(row?.["real"]),
      newLast7Days: num(row?.["new7"]),
      fictitious: num(row?.["fictitious"]),
      pendingInvitations: num(row?.["pending"]),
    };
  }

  /** Real accounts existing at the end of each of the last `days` days, oldest first. */
  async accountsDaily(days: number): Promise<number[]> {
    const rows = await rowsOf<{ count: unknown }>(
      this.db,
      sql`select (select count(*) from users u
          where ${REAL_ACCOUNT} and u.created_at < ${parisMidnight(sql`back - 1`)}) as count
        from generate_series(${days - 1}::int, 0, -1) as back`,
    );
    return rows.map((row) => num(row.count));
  }

  async flightCounts(): Promise<FlightCounts> {
    const [row] = await rowsOf<Record<string, unknown>>(
      this.db,
      sql`select
        count(*) filter (where ${REAL_FLIGHT}) as real,
        count(*) filter (where ${REAL_FLIGHT} and f.opened_at > now() - interval '7 days') as new7,
        count(*) filter (where ${REAL_FLIGHT} and f.opened_at >= ${parisMidnight(sql`0`)}) as today,
        count(*) filter (where not ${REAL_FLIGHT}) as simulated
      from ${FLIGHTS_WITH_PILOT}`,
    );
    return {
      real: num(row?.["real"]),
      newLast7Days: num(row?.["new7"]),
      today: num(row?.["today"]),
      simulated: num(row?.["simulated"]),
    };
  }

  /** Flights opened per day in Paris since `days` days ago; days without flight are missing. */
  async flightsPerDay(days: number): Promise<DayCount[]> {
    const rows = await rowsOf<Record<string, unknown>>(
      this.db,
      sql`select ${parisDay(sql`f.opened_at`)} as date,
          count(*) filter (where ${REAL_FLIGHT}) as real,
          count(*) filter (where not ${REAL_FLIGHT}) as simulated
        from ${FLIGHTS_WITH_PILOT}
        where f.opened_at >= ${parisMidnight(sql`${days - 1}::int`)}
        group by 1`,
    );
    return rows.map((row) => ({
      date: String(row["date"]),
      real: num(row["real"]),
      simulated: num(row["simulated"]),
    }));
  }

  /** How many of these flights are simulated. */
  async countSimulated(flightIds: readonly string[]): Promise<number> {
    if (flightIds.length === 0) return 0;
    const [row] = await rowsOf<{ count: unknown }>(
      this.db,
      sql`select count(*) as count from ${FLIGHTS_WITH_PILOT}
        where f.id = any(${`{${flightIds.join(",")}}`}::uuid[]) and not ${REAL_FLIGHT}`,
    );
    return num(row?.count);
  }

  async profileCounts(): Promise<ProfileCounts> {
    const [row] = await rowsOf<Record<string, unknown>>(
      this.db,
      sql`select count(*) as public,
          count(*) filter (where p.published_at > now() - interval '7 days') as new7
        from pilot_profiles p join users u on u.id = p.pilot_id
        where p.is_public and ${REAL_ACCOUNT}`,
    );
    return { public: num(row?.["public"]), newLast7Days: num(row?.["new7"]) };
  }

  /** Public profiles of real accounts at the end of each of the last `days` days, oldest first. */
  async profilesDaily(days: number): Promise<number[]> {
    const rows = await rowsOf<{ count: unknown }>(
      this.db,
      sql`select (select count(*) from pilot_profiles p join users u on u.id = p.pilot_id
          where p.is_public and ${REAL_ACCOUNT} and p.published_at < ${parisMidnight(sql`back - 1`)}) as count
        from generate_series(${days - 1}::int, 0, -1) as back`,
    );
    return rows.map((row) => num(row.count));
  }

  /** Facts of every real flight, for the rules of the alpha report. */
  async realFlightFacts(): Promise<FlightFacts[]> {
    const rows = await rowsOf<Record<string, unknown>>(
      this.db,
      sql`select f.pilot_id, f.opened_at, f.closed_at, t.flight_id as track, r.phases
        from ${FLIGHTS_WITH_PILOT}
        left join flight_tracks t on t.flight_id = f.id
        left join flight_reviews r on r.flight_id = f.id
        where ${REAL_FLIGHT}`,
    );
    return rows.map((row) => ({
      pilotId: String(row["pilot_id"]),
      openedAt: new Date(String(row["opened_at"])),
      closedAt: row["closed_at"] ? new Date(String(row["closed_at"])) : null,
      hasTrack: row["track"] !== null,
      phases: row["phases"] as FlightFacts["phases"],
    }));
  }

  /** Real flights of the last 30 days per tracker version, most used first. */
  async trackerVersions(): Promise<{ version: string; flights: number }[]> {
    const rows = await rowsOf<Record<string, unknown>>(
      this.db,
      sql`select f.tracker_version as version, count(*) as flights from ${FLIGHTS_WITH_PILOT}
        where ${REAL_FLIGHT} and f.opened_at > now() - interval '30 days'
        group by 1 order by 2 desc, 1 desc`,
    );
    return rows.map((row) => ({ version: String(row["version"]), flights: num(row["flights"]) }));
  }
}
