import type Database from "better-sqlite3";
import type { FlightEvent, PositionReport } from "@weems/contrats";
import type { ApiClient } from "./api-client.ts";
import { actionFor, retryDelayMs } from "./retry.ts";

interface OutboxRow {
  id: number;
  flight_id: string;
  kind: "open" | "events" | "close";
  payload: string;
  attempts: number;
}

/** One request: an outbox row, or several consecutive event rows of a flight merged. */
interface Message {
  ids: number[];
  flightId: string;
  path: string;
  body: unknown;
  attempts: number;
}

/** Why sending stopped for every flight: the pilot has something to do. */
export type SenderBlock = "unauthorized" | "upgradeRequired" | null;

const MAX_EVENTS_PER_REQUEST = 500;
const POSITION_MAX_AGE_MS = 30_000;

function pathOf(row: OutboxRow): string {
  if (row.kind === "open") return "/v1/flights";
  return `/v1/flights/${row.flight_id}/${row.kind}`;
}

/** True when `row` can join the events request `last` (same flight, room left). */
function canMerge(last: Message | undefined, row: OutboxRow): last is Message {
  const events = (last?.body as { events?: FlightEvent[] } | undefined)?.events;
  return (
    row.kind === "events" &&
    last?.flightId === row.flight_id &&
    events !== undefined &&
    events.length < MAX_EVENTS_PER_REQUEST
  );
}

/** Merges consecutive event rows of the same flight into one request. */
function toMessages(rows: OutboxRow[]): Message[] {
  const messages: Message[] = [];
  for (const row of rows) {
    const body = JSON.parse(row.payload) as unknown;
    const last = messages.at(-1);
    if (canMerge(last, row)) {
      (last.body as { events: FlightEvent[] }).events.push(
        ...(body as { events: FlightEvent[] }).events,
      );
      last.ids.push(row.id);
    } else {
      messages.push({
        ids: [row.id],
        flightId: row.flight_id,
        path: pathOf(row),
        body,
        attempts: row.attempts,
      });
    }
  }
  return messages;
}

/**
 * Sends the outbox in order (architecture interne, part 4). Messages of a flight leave in order:
 * when one is not accepted, the rest of that flight waits. Nothing is lost if the PC stops.
 */
export class OutboxSender {
  private readonly db: Database.Database;
  private readonly api: ApiClient;
  private readonly random: () => number;
  private blocked: SenderBlock = null;

  constructor(db: Database.Database, api: ApiClient, random: () => number = Math.random) {
    this.db = db;
    this.api = api;
    this.random = random;
  }

  get block(): SenderBlock {
    return this.blocked;
  }

  /** Number of messages still to send (parked ones excluded). */
  pendingCount(): number {
    return (
      this.db.prepare("SELECT count(*) AS n FROM outbox WHERE status = 'pending'").get() as {
        n: number;
      }
    ).n;
  }

  /** One sending round at time `nowMs`. Returns how many requests were accepted. */
  async drain(nowMs: number): Promise<number> {
    if (this.blocked) return 0;
    const rows = this.db
      .prepare("SELECT * FROM outbox WHERE status = 'pending' ORDER BY id")
      .all() as OutboxRow[];
    const waiting = new Set<string>();
    let accepted = 0;
    for (const message of toMessages(rows)) {
      if (waiting.has(message.flightId) || this.blocked) continue;
      if (!this.isDue(message, nowMs) || !(await this.send(message, nowMs))) {
        waiting.add(message.flightId);
      } else accepted += 1;
    }
    return accepted;
  }

  /** Live position: best effort, never queued; dropped when older than 30 s. */
  async sendPosition(flightId: string, report: PositionReport, nowMs: number): Promise<boolean> {
    if (this.blocked || nowMs - Date.parse(report.at) > POSITION_MAX_AGE_MS) return false;
    try {
      const { status } = await this.api.post(`/v1/flights/${flightId}/positions`, report);
      return actionFor(status) === "done";
    } catch {
      return false;
    }
  }

  private isDue(message: Message, nowMs: number): boolean {
    const row = this.db
      .prepare("SELECT next_attempt_at AS at FROM outbox WHERE id = ?")
      .get(message.ids[0]) as { at: number };
    return row.at <= nowMs;
  }

  /** Returns true when the API accepted the message. */
  private async send(message: Message, nowMs: number): Promise<boolean> {
    let status: number | "networkError";
    try {
      status = (await this.api.post(message.path, message.body)).status;
    } catch {
      status = "networkError";
    }
    const action = actionFor(status);
    if (action === "done") this.remove(message);
    else if (action === "retry") this.postpone(message, nowMs);
    else if (action === "park") this.park(message, status);
    else this.blocked = action;
    return action === "done";
  }

  private remove(message: Message): void {
    const remove = this.db.prepare("DELETE FROM outbox WHERE id = ?");
    this.db.transaction(() => message.ids.forEach((id) => remove.run(id)))();
  }

  private postpone(message: Message, nowMs: number): void {
    const attempts = message.attempts + 1;
    const next = nowMs + retryDelayMs(attempts, this.random);
    const update = this.db.prepare(
      "UPDATE outbox SET attempts = ?, next_attempt_at = ? WHERE id = ?",
    );
    this.db.transaction(() => message.ids.forEach((id) => update.run(attempts, next, id)))();
  }

  /** 409 or another 4xx: set aside, logged, never re-sent in a loop. */
  private park(message: Message, status: number | "networkError"): void {
    const update = this.db.prepare(
      "UPDATE outbox SET status = 'parked', last_error = ? WHERE id = ?",
    );
    this.db.transaction(() => message.ids.forEach((id) => update.run(`HTTP ${status}`, id)))();
  }
}
