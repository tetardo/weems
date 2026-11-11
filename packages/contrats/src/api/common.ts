import { z } from "zod";

/** Flight identifier: UUID v7, created by the tracker when the flight opens. */
export const FlightId = z.uuid({ version: "v7" });

/** UTC timestamp, ISO 8601 with exactly 3 decimals (e.g. 2026-11-11T08:15:30.250Z), so it reads back identically. */
export const UtcTimestamp = z.iso.datetime({ precision: 3 });

/** Airport ICAO code (3-4 letters or digits, e.g. LFPG). */
export const IcaoCode = z.string().regex(/^[A-Z0-9]{3,4}$/);

/** Per-flight message sequence number; with the flight id it makes re-sends idempotent. */
export const Sequence = z.number().int().nonnegative();

/** Error body, RFC 9457 "problem details". */
export const Problem = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string().optional(),
});
export type Problem = z.infer<typeof Problem>;
