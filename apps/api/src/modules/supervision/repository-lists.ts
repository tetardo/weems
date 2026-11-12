import type { SupervisionEventKind } from "@weems/contrats";
import { sql } from "drizzle-orm";
import type { Database } from "../../db/client.ts";
import { FLIGHTS_WITH_PILOT, REAL_ACCOUNT, REAL_FLIGHT, num, rowsOf } from "./sql-parts.ts";

export interface EventRecord {
  at: Date;
  kind: SupervisionEventKind;
  pilot: string | null;
  callsign: string | null;
  from: string | null;
  to: string | null;
}

export interface PilotRecord {
  id: string;
  name: string;
  publicHandle: string | null;
}

export interface PilotActivity extends PilotRecord {
  flights: number;
  hours: number;
}

const PUBLIC_HANDLE = sql`(select p.handle from pilot_profiles p where p.pilot_id = u.id and p.is_public)`;

/** Hours of the closed flights `f`, from opening to closing. */
const HOURS = sql`coalesce(sum(extract(epoch from (f.closed_at - f.opened_at))) / 3600, 0)`;

/** Dated facts of the real activity, newest first, from the dates the tables already hold. */
const EVENTS = sql`
  select u.created_at as at, 'accountCreated' as kind, u.name as pilot,
         null as callsign, null as dep, null as arr
    from users u where not u.fictitious
  union all
  select u.disabled_at, 'accountDisabled', u.name, null, null, null
    from users u where not u.fictitious and u.disabled_at is not null
  union all
  select i.created_at, 'invitationCreated', null, null, null, null from invitations i
  union all
  select p.published_at, 'profilePublished', u.name, null, null, null
    from pilot_profiles p join users u on u.id = p.pilot_id
    where p.is_public and p.published_at is not null and ${REAL_ACCOUNT}
  union all
  select f.opened_at, 'flightOpened', u.name, f.callsign, f.departure_icao, f.planned_arrival_icao
    from ${FLIGHTS_WITH_PILOT} where ${REAL_FLIGHT}
  union all
  select f.closed_at, 'flightClosed', u.name, f.callsign, f.departure_icao, f.planned_arrival_icao
    from ${FLIGHTS_WITH_PILOT} where ${REAL_FLIGHT} and f.closed_at is not null`;

const pilotOf = (row: Record<string, unknown>): PilotRecord => ({
  id: String(row["id"]),
  name: String(row["name"]),
  publicHandle: row["handle"] === null ? null : String(row["handle"]),
});

const activityOf = (row: Record<string, unknown>): PilotActivity => ({
  ...pilotOf(row),
  flights: num(row["flights"]),
  hours: num(row["hours"]),
});

const text = (value: unknown): string | null => (value === null ? null : String(value));

/** The lists of the page Supervision: latest events and the blocks « Communauté ». */
export class SupervisionListsRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async latestEvents(limit: number): Promise<EventRecord[]> {
    const rows = await rowsOf<Record<string, unknown>>(
      this.db,
      sql`select * from (${EVENTS}) e order by at desc limit ${limit}`,
    );
    return rows.map((row) => ({
      at: new Date(String(row["at"])),
      kind: row["kind"] as SupervisionEventKind,
      pilot: text(row["pilot"]),
      callsign: text(row["callsign"]),
      from: text(row["dep"]),
      to: text(row["arr"]),
    }));
  }

  /** Real accounts, newest first. */
  async newestPilots(limit: number): Promise<(PilotRecord & { createdAt: Date })[]> {
    const rows = await rowsOf<Record<string, unknown>>(
      this.db,
      sql`select u.id, u.name, u.created_at, ${PUBLIC_HANDLE} as handle from users u
        where ${REAL_ACCOUNT} order by u.created_at desc limit ${limit}`,
    );
    return rows.map((row) => ({ ...pilotOf(row), createdAt: new Date(String(row["created_at"])) }));
  }

  /** Real accounts with the most real flights of the last 30 days, then the most hours. */
  async mostActive(limit: number): Promise<PilotActivity[]> {
    const rows = await rowsOf<Record<string, unknown>>(
      this.db,
      sql`select u.id, u.name, ${PUBLIC_HANDLE} as handle, count(*) as flights, ${HOURS} as hours
        from ${FLIGHTS_WITH_PILOT}
        where ${REAL_FLIGHT} and ${REAL_ACCOUNT} and f.opened_at > now() - interval '30 days'
        group by u.id order by flights desc, hours desc limit ${limit}`,
    );
    return rows.map(activityOf);
  }

  /** Real accounts with the most hours of real flights, all time. */
  async mostHours(limit: number): Promise<PilotActivity[]> {
    const rows = await rowsOf<Record<string, unknown>>(
      this.db,
      sql`select u.id, u.name, ${PUBLIC_HANDLE} as handle, count(*) as flights, ${HOURS} as hours
        from ${FLIGHTS_WITH_PILOT}
        where ${REAL_FLIGHT} and ${REAL_ACCOUNT} and f.closed_at is not null
        group by u.id order by hours desc, flights desc limit ${limit}`,
    );
    return rows.map(activityOf);
  }
}
